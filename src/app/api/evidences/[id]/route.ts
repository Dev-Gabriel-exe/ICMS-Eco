// src/app/api/evidences/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { deleteFile } from "@/lib/r2";
import { sendEvidenceReturnedEmail } from "@/lib/brevo";

// ─── PUT /api/evidences/[id] — valida ou devolve evidência ────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const body = await req.json();

  // Admin pode devolver com motivo
  if (body.action === "return") {
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const evidence = await db.evidence.update({
      where: { id: params.id },
      data: { isValid: false },
      include: {
        uploader: { select: { email: true, name: true } },
        checklistItem: {
          include: {
            criteria: { select: { id: true, description: true } },
            municipality: { select: { name: true } },
          },
        },
      },
    });

    // Notifica funcionário
    try {
      await sendEvidenceReturnedEmail({
        to: { email: evidence.uploader.email, name: evidence.uploader.name },
        criterionId: evidence.checklistItem.criteria.id,
        criterionDesc: evidence.checklistItem.criteria.description,
        returnReason: body.reason ?? "Motivo não informado",
        municipalityName: evidence.checklistItem.municipality.name,
      });
    } catch (err) {
      console.error("[evidences/PUT] Falha ao notificar:", err);
    }

    return NextResponse.json({ success: true, data: evidence });
  }

  // Atualiza checklist de validação
  const {
    hasDate,
    dateIsInPeriod,
    hasGeotag,
    isPdfSearchable,
    hasElectronicSignature,
    followsAnnexII,
    isOriginalDoc,
  } = body;

  const updated = await db.evidence.update({
    where: { id: params.id },
    data: {
      ...(hasDate !== undefined && { hasDate }),
      ...(dateIsInPeriod !== undefined && { dateIsInPeriod }),
      ...(hasGeotag !== undefined && { hasGeotag }),
      ...(isPdfSearchable !== undefined && { isPdfSearchable }),
      ...(hasElectronicSignature !== undefined && { hasElectronicSignature }),
      ...(followsAnnexII !== undefined && { followsAnnexII }),
      ...(isOriginalDoc !== undefined && { isOriginalDoc }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

// ─── DELETE /api/evidences/[id] ────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const evidence = await db.evidence.findUnique({ where: { id: params.id } });
  if (!evidence) return NextResponse.json({ success: false, error: "Não encontrado" }, { status: 404 });

  // Remove do R2
  try {
    await deleteFile(evidence.fileKey);
  } catch (err) {
    console.error("[evidences/DELETE] Falha ao remover do R2:", err);
  }

  await db.evidence.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
