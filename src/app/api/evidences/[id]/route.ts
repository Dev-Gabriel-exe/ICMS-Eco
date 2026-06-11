// src/app/api/evidences/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { deleteFile } from "@/lib/r2";
import { sendEvidenceReturnedEmail } from "@/lib/brevo";

// ─── PUT /api/evidences/[id] ───────────────────────────────────────────────
// Ações: "approve" | "reject" | "validate" (checklist de qualidade)

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // ── APROVAR ────────────────────────────────────────────────────────────────
  if (body.action === "approve") {
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        validationStatus: "approved",
        isValid: true,
        reviewComment: body.comment?.trim() || null,
        validatedBy: session.user.id,
        validatedAt: new Date(),
      },
      select: { id: true, fileName: true },
    });

    await logAction({
      userId: session.user.id,
      action: "EVIDENCE_APPROVED",
      entityType: "Evidence",
      entityId: evidence.id,
      description: `Aprovou a evidência "${evidence.fileName}"${body.comment ? ` — "${body.comment}"` : ""}`,
    });

    return NextResponse.json({ success: true, data: evidence });
  }

  // ── REJEITAR ───────────────────────────────────────────────────────────────
  if (body.action === "reject") {
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        validationStatus: "rejected",
        isValid: false,
        reviewComment: body.comment?.trim() || null,
        validatedBy: session.user.id,
        validatedAt: new Date(),
      },
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

    await logAction({
      userId: session.user.id,
      action: "EVIDENCE_REJECTED",
      entityType: "Evidence",
      entityId: evidence.id,
      description: `Rejeitou a evidência "${evidence.fileName}"${body.comment ? ` — "${body.comment}"` : ""}`,
    });

    // Notifica o funcionário por e-mail
    try {
      await sendEvidenceReturnedEmail({
        to: { email: evidence.uploader.email, name: evidence.uploader.name },
        criterionId: evidence.checklistItem.criteria.id,
        criterionDesc: evidence.checklistItem.criteria.description,
        returnReason: body.comment ?? "Motivo não informado",
        municipalityName: evidence.checklistItem.municipality.name,
      });
    } catch (err) {
      console.error("[evidences/PUT/reject] Falha ao notificar:", err);
    }

    return NextResponse.json({ success: true, data: evidence });
  }

  // ── DEVOLVER (legado — mantido para compatibilidade) ───────────────────────
  if (body.action === "return") {
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const evidence = await db.evidence.update({
      where: { id },
      data: {
        validationStatus: "rejected",
        isValid: false,
        reviewComment: body.reason?.trim() || null,
        validatedBy: session.user.id,
        validatedAt: new Date(),
      },
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

    await logAction({
      userId: session.user.id,
      action: "EVIDENCE_RETURNED",
      entityType: "Evidence",
      entityId: evidence.id,
      description: `Devolveu a evidência "${evidence.fileName}"`,
    });

    try {
      await sendEvidenceReturnedEmail({
        to: { email: evidence.uploader.email, name: evidence.uploader.name },
        criterionId: evidence.checklistItem.criteria.id,
        criterionDesc: evidence.checklistItem.criteria.description,
        returnReason: body.reason ?? "Motivo não informado",
        municipalityName: evidence.checklistItem.municipality.name,
      });
    } catch (err) {
      console.error("[evidences/PUT/return] Falha ao notificar:", err);
    }

    return NextResponse.json({ success: true, data: evidence });
  }

  // ── CHECKLIST DE QUALIDADE (admin preenche campos técnicos) ────────────────
  if (body.action === "validate") {
    if (session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }

    const {
      hasDate, dateIsInPeriod, hasGeotag,
      isPdfSearchable, hasElectronicSignature,
      followsAnnexII, isOriginalDoc,
    } = body;

    const updated = await db.evidence.update({
      where: { id },
      data: {
        ...(hasDate !== undefined && { hasDate }),
        ...(dateIsInPeriod !== undefined && { dateIsInPeriod }),
        ...(hasGeotag !== undefined && { hasGeotag }),
        ...(isPdfSearchable !== undefined && { isPdfSearchable }),
        ...(hasElectronicSignature !== undefined && { hasElectronicSignature }),
        ...(followsAnnexII !== undefined && { followsAnnexII }),
        ...(isOriginalDoc !== undefined && { isOriginalDoc }),
      },
      select: { id: true, fileName: true },
    });

    await logAction({
      userId: session.user.id,
      action: "EVIDENCE_APPROVED",
      entityType: "Evidence",
      entityId: updated.id,
      description: `Atualizou checklist da evidência "${updated.fileName}"`,
    });

    return NextResponse.json({ success: true, data: updated });
  }

  return NextResponse.json({ success: false, error: "Ação inválida" }, { status: 400 });
}

// ─── DELETE /api/evidences/[id] ────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const evidence = await db.evidence.findUnique({ where: { id } });

  if (!evidence) {
    return NextResponse.json({ success: false, error: "Não encontrado" }, { status: 404 });
  }

  const isAdmin    = session.user.role === "admin";
  const isUploader = evidence.uploadedBy === session.user.id;
  const isPending  = evidence.validationStatus === "pending";

  // Funcionário só pode excluir arquivos pendentes que ele mesmo enviou
  // Admin pode excluir qualquer arquivo
  if (!isAdmin && (!isUploader || !isPending)) {
    return NextResponse.json(
      { success: false, error: "Sem permissão. Arquivos aprovados só podem ser removidos pelo administrador." },
      { status: 403 }
    );
  }

  try {
    await deleteFile(evidence.fileKey);
  } catch (err) {
    console.error("[evidences/DELETE] Falha ao remover do R2:", err);
  }

  await logAction({
    userId: session.user.id,
    action: "EVIDENCE_DELETED",
    entityType: "Evidence",
    entityId: evidence.id,
    description: `Removeu a evidência "${evidence.fileName}"`,
  });

  await db.evidence.delete({ where: { id } });

  return NextResponse.json({ success: true });
}