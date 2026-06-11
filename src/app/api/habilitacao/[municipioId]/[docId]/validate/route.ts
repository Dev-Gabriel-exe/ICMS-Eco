// src/app/api/habilitacao/[municipioId]/[docId]/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { sendHabilitacaoDocValidatedEmail } from "@/lib/brevo";

// ─────────────────────────────────────────────
// PUT /api/habilitacao/[municipioId]/[docId]/validate
// Valida um documento de habilitação (aprovado ou reprovado)
// Body: { status: "approved" | "rejected", rejectReason?: string }
// ─────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { municipioId: string; docId: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Acesso negado" },
      { status: 403 }
    );
  }

  const { municipioId, docId } = params;
  const { status, rejectReason } = await req.json();

  if (!status || !["approved", "rejected"].includes(status)) {
    return NextResponse.json(
      { success: false, error: "Status inválido" },
      { status: 400 }
    );
  }

  if (status === "rejected" && !rejectReason?.trim()) {
    return NextResponse.json(
      { success: false, error: "Motivo da rejeição é obrigatório" },
      { status: 400 }
    );
  }

  // Busca o documento
  const habDoc = await db.habilitacaoDoc.findUnique({
    where: { id: docId },
    include: {
      municipality: true,
      certame: true,
    },
  });

  if (!habDoc || habDoc.municipalityId !== municipioId) {
    return NextResponse.json(
      { success: false, error: "Documento não encontrado" },
      { status: 404 }
    );
  }

  // Atualiza status
  const updatedDoc = await db.habilitacaoDoc.update({
    where: { id: docId },
    data: {
      status: status as "approved" | "rejected",
      validatedBy: session.user.id,
      validatedAt: new Date(),
      rejectReason: status === "rejected" ? rejectReason.trim() : null,
    },
    include: {
      validator: {
        select: {
          name: true,
          email: true,
        },
      },
      municipality: true,
    },
  });

  // AUDITORIA
  const action =
    status === "approved"
      ? "HABILITACAO_DOC_APPROVED"
      : "HABILITACAO_DOC_REJECTED";

  await logAction({
    userId: session.user.id,
    action: action as any,
    entityType: "HabilitacaoDoc",
    entityId: habDoc.id,
    description: `${status === "approved" ? "Aprovou" : "Reprovou"} o documento ${habDoc.code}${
      status === "rejected" ? `: ${rejectReason}` : ""
    }`,
  });

  // Notifica o município (email para os usuários vinculados)
  try {
    const municipalityUsers = await db.userMunicipality.findMany({
      where: { municipalityId: municipioId  },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (municipalityUsers.length > 0) {
      const docLabel = getDocLabel(habDoc.code);
      await sendHabilitacaoDocValidatedEmail({
        to: municipalityUsers.map((m) => ({
          email: m.user.email,
          name: m.user.name,
        })),
        municipalityName: habDoc.municipality.name,
        docCode: habDoc.code,
        docLabel,
        status,
        rejectReason: status === "rejected" ? rejectReason : undefined,
        validatorName: session.user.name ?? "Admin",
      });
    }
  } catch (err) {
    console.error("[habilitacao/validate/PUT] Falha ao notificar:", err);
  }

  return NextResponse.json({
    success: true,
    data: updatedDoc,
  });
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function getDocLabel(code: string): string {
  const labels: Record<string, string> = {
    CONSELHO_CRIACAO: "Lei/Decreto de Criação do Conselho",
    CONSELHO_ATA: "Ata de Reunião do Conselho",
    SECRETARIA_CRIACAO: "Lei de Criação do Órgão Ambiental",
    SECRETARIA_NOMEACAO: "Ato de Nomeação do Secretário/Técnicos",
    SECRETARIA_QUADRO: "Comprovação do Quadro Mínimo de Profissionais",
    PLANO_DIRETOR: "Plano Diretor com Capítulo Ambiental",
  };
  return labels[code] || code;
}
