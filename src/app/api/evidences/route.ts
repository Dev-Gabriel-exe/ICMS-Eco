// src/app/api/evidences/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEvidenceUploadedEmail } from "@/lib/brevo";
import { logAction } from "@/lib/audit";

function getPublicFileUrl(fileKey: string): string {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL não configurada");
  }
  return `${publicUrl}/${fileKey}`;
}

// ─── GET /api/evidences?checklistItemId= ───────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const checklistItemId  = searchParams.get("checklistItemId");
  const municipalityId   = searchParams.get("municipalityId");

  let where: Record<string, unknown> = {};

  if (checklistItemId) {
    where = { checklistItemId };
  } else if (municipalityId) {
    where = { checklistItem: { municipalityId } };
  }

  const evidences = await db.evidence.findMany({
    where,
    include: {
      uploader: {
        select: { name: true, email: true },
      },
      // ← ADICIONADO: dados do validador
      validator: {
        select: { name: true, email: true },
      },
      // ← ADICIONADO: dados do sub-documento
      subDoc: {
        select: { id: true, code: true, label: true, description: true },
      },
      checklistItem: {
        include: {
          criteria: {
            select: { id: true, description: true, axis: true, axisName: true },
          },
          // ← ADICIONADO: nome do município
          municipality: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { uploadedAt: "asc" },
  });

  return NextResponse.json({ success: true, data: evidences });
}

// ─── POST /api/evidences ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const {
    checklistItemId,
    subDocId,        // ← ADICIONADO
    fileName,
    fileKey,
    fileSizeBytes,
    fileType,
  } = await req.json();

  if (!checklistItemId || !fileName || !fileKey) {
    return NextResponse.json(
      { success: false, error: "Campos obrigatórios" },
      { status: 400 }
    );
  }

  let fileUrl: string;
  try {
    fileUrl = getPublicFileUrl(fileKey);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Falha ao montar URL do arquivo",
      },
      { status: 500 }
    );
  }

  const evidence = await db.evidence.create({
    data: {
      checklistItemId,
      subDocId:      subDocId ?? null, // ← ADICIONADO
      fileName,
      fileUrl,
      fileKey,
      fileSizeBytes: fileSizeBytes ?? null,
      fileType:      fileType ?? null,
      uploadedBy:    session.user.id,
      isValid:       true,
    },
    include: {
      uploader: {
        select: { name: true, email: true },
      },
      validator: {
        select: { name: true, email: true },
      },
      subDoc: {
        select: { id: true, code: true, label: true, description: true },
      },
      checklistItem: {
        include: {
          criteria: {
            select: { id: true, description: true, axisName: true },
          },
          municipality: {
            select: { name: true },
          },
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
    description: `Enviou a evidência "${evidence.fileName}"`,
  });

  // Notifica admins
  try {
    const admins = await db.user.findMany({
      where: { role: "admin" },
      select: { email: true, name: true },
    });

    if (admins.length > 0) {
      await sendEvidenceUploadedEmail({
        to: admins.map((a) => ({ email: a.email, name: a.name })),
        municipalityName: evidence.checklistItem.municipality.name,
        criterionId:      evidence.checklistItem.criteria.id,
        criterionDesc:    evidence.checklistItem.criteria.description,
        uploadedBy:       session.user.name ?? session.user.email ?? "Funcionário",
      });
    }
  } catch (err) {
    console.error("[evidences/POST] Falha ao notificar:", err);
  }

  return NextResponse.json({ success: true, data: evidence }, { status: 201 });
}
