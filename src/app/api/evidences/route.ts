// src/app/api/evidences/route.ts
import { NextRequest, NextResponse } from "next/server";

// ─── GET /api/evidences?checklistItemId= ───────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const checklistItemId = searchParams.get("checklistItemId");
  const municipalityId = searchParams.get("municipalityId");

  let where: Record<string, unknown> = {};
  if (checklistItemId) where = { checklistItemId };
  else if (municipalityId) where = { checklistItem: { municipalityId } };

  const evidences = await db.evidence.findMany({
    where,
    include: {
      uploader: { select: { name: true, email: true } },
      checklistItem: { include: { criteria: { select: { id: true, description: true, axis: true } } } },
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: evidences });
}

// ─── POST /api/evidences — registra upload já feito no R2 ─────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { checklistItemId, fileName, fileUrl, fileKey, fileSizeBytes, fileType } = await req.json();

  if (!checklistItemId || !fileName || !fileUrl || !fileKey) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
  }

  const evidence = await db.evidence.create({
    data: {
      checklistItemId,
      fileName,
      fileUrl,
      fileKey,
      fileSizeBytes: fileSizeBytes ?? null,
      fileType: fileType ?? null,
      uploadedBy: session.user.id,
      isValid: true,
    },
    include: {
      checklistItem: {
        include: {
          criteria: { select: { id: true, description: true } },
          municipality: { select: { name: true } },
        },
      },
    },
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
        criterionId: evidence.checklistItem.criteria.id,
        criterionDesc: evidence.checklistItem.criteria.description,
        uploadedBy: session.user.name ?? session.user.email ?? "Funcionário",
      });
    }
  } catch (err) {
    console.error("[evidences/POST] Falha ao notificar:", err);
  }

  return NextResponse.json({ success: true, data: evidence }, { status: 201 });
}
