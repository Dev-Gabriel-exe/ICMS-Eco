// src/app/api/evidences/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  r2Client,
  generateFileKey,
  getPublicFileUrl,
  validateFile,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { sendEvidenceUploadedEmail } from "@/lib/brevo";
import { logAction } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const file            = formData.get("file")            as File   | null;
  const municipalityId  = formData.get("municipalityId")  as string | null;
  const criteriaId      = formData.get("criteriaId")      as string | null;
  const checklistItemId = formData.get("checklistItemId") as string | null;

  // ✅ FIX: lê subDocId do FormData (enviado pelo SubDocCard)
  const subDocId        = formData.get("subDocId")        as string | null;
  const kindRaw         = formData.get("kind")            as string | null;
  const evidenceKind    = kindRaw === "evidence" ? "evidence" : "document";

  if (!file || !municipalityId || !criteriaId || !checklistItemId) {
    return NextResponse.json(
      { success: false, error: "Campos obrigatórios ausentes" },
      { status: 400 }
    );
  }

  // Valida tipo e tamanho
  const validation = validateFile(file.type, file.size);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  // Gera chave do arquivo
  const fileKey = generateFileKey(municipalityId, criteriaId, file.name);

  // Converte File para Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload para R2
  await r2Client.send(
    new PutObjectCommand({
      Bucket:        process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key:           fileKey,
      Body:          buffer,
      ContentType:   file.type,
      ContentLength: file.size,
      Metadata: {
        "uploaded-at": new Date().toISOString(),
        "uploaded-by": session.user.id,
      },
    })
  );

  const fileUrl = getPublicFileUrl(fileKey);

  // ✅ FIX: salva subDocId no banco (null quando não informado = upload genérico)
  const evidence = await db.evidence.create({
    data: {
      checklistItemId,
      subDocId: evidenceKind === "document" ? (subDocId || null) : null,
      kind:          evidenceKind,
      fileName:      file.name,
      fileUrl,
      fileKey,
      fileSizeBytes: file.size,
      fileType:      file.type,
      uploadedBy:    session.user.id,
      isValid:       true,
    },
    include: {
      subDoc: true,                 // ← retorna o subDoc populado para o frontend
      checklistItem: {
        include: {
          criteria:     { select: { id: true, description: true } },
          municipality: { select: { name: true } },
        },
      },
    },
  });

  // Auditoria
  await logAction({
    userId:      session.user.id,
    action:      "EVIDENCE_UPLOADED",
    entityType:  "Evidence",
    entityId:    evidence.id,
    description: `Enviou a evidência "${evidence.fileName}"${
      subDocId ? ` para o sub-documento ${evidence.subDoc?.label ?? subDocId}` : ""
    }`,
  });

  // Notifica admins
  try {
    const admins = await db.user.findMany({
      where:  { role: "admin" },
      select: { email: true, name: true },
    });

    if (admins.length > 0) {
      await sendEvidenceUploadedEmail({
        to:             admins.map((a) => ({ email: a.email, name: a.name })),
        municipalityName: evidence.checklistItem.municipality.name,
        criterionId:    evidence.checklistItem.criteria.id,
        criterionDesc:  evidence.checklistItem.criteria.description,
        uploadedBy:     session.user.name ?? session.user.email ?? "Funcionário",
      });
    }
  } catch (err) {
    console.error("[evidences/upload] Falha ao notificar:", err);
  }

  return NextResponse.json({ success: true, data: evidence }, { status: 201 });
}