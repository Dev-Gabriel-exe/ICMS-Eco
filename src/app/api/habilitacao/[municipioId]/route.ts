// src/app/api/habilitacao/[municipioId]/route.ts
// CORREÇÃO: POST agora monta fileUrl no servidor usando CLOUDFLARE_R2_PUBLIC_URL
// (não depende de variável NEXT_PUBLIC_ no cliente)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { HabDocCode } from "@prisma/client";

const ALL_CODES: HabDocCode[] = [
  "CONSELHO_CRIACAO",
  "CONSELHO_ATA",
  "SECRETARIA_CRIACAO",
  "SECRETARIA_NOMEACAO",
  "SECRETARIA_QUADRO",
  "PLANO_DIRETOR",
];

const REQUIRED_CODES: HabDocCode[] = [
  "CONSELHO_CRIACAO",
  "CONSELHO_ATA",
  "SECRETARIA_CRIACAO",
  "SECRETARIA_NOMEACAO",
  "SECRETARIA_QUADRO",
];

// ─── GET /api/habilitacao/[municipioId] ─────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { municipioId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { municipioId } = params;

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }
  }

  const [municipality, activeCertame] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true } }),
  ]);

  if (!municipality) {
    return NextResponse.json({ success: false, error: "Município não encontrado" }, { status: 404 });
  }
  if (!activeCertame) {
    return NextResponse.json({ success: false, error: "Nenhum certame ativo" }, { status: 404 });
  }

  const existingDocs = await db.habilitacaoDoc.findMany({
    where: { municipalityId: municipioId, certameId: activeCertame.id },
    include: {
      files: {
        orderBy: { uploadedAt: "desc" },
        include: { uploader: { select: { name: true, email: true } } },
      },
      validator: { select: { name: true } },
    },
    orderBy: { updatedAt: "asc" },
  });

  const existingMap = new Map(existingDocs.map(d => [d.code, d]));

  const allDocs = ALL_CODES.map(code => {
    const existing = existingMap.get(code);
    if (existing) return existing;
    return {
      id:             null,
      code,
      status:         "not_started" as const,
      rejectReason:   null,
      validatedAt:    null,
      validator:      null,
      files:          [],
      municipalityId: municipioId,
      certameId:      activeCertame.id,
      updatedAt:      null,
    };
  });

  const approvedRequired = allDocs.filter(
    d => REQUIRED_CODES.includes(d.code as HabDocCode) && d.status === "approved"
  ).length;
  const isHabilitado = approvedRequired === REQUIRED_CODES.length;

  return NextResponse.json({
    success: true,
    data: {
      municipalityId: municipioId,
      municipalityName: municipality.name,
      certameId: activeCertame.id,
      certameYear: activeCertame.year,
      docs: allDocs,
      isHabilitado,
    },
  });
}

// ─── POST /api/habilitacao/[municipioId] ────────────────────────────────────
// CORREÇÃO: monta fileUrl no servidor — não depende de variável NEXT_PUBLIC_

export async function POST(
  req: NextRequest,
  { params }: { params: { municipioId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { municipioId } = params;

  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) {
      return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
    }
  }

  const activeCertame = await db.certame.findFirst({ where: { isActive: true } });
  if (!activeCertame) {
    return NextResponse.json({ success: false, error: "Nenhum certame ativo" }, { status: 400 });
  }

  const { docCode, fileName, fileKey, fileSizeBytes, fileType } = await req.json();

  if (!docCode || !fileName || !fileKey) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  if (!ALL_CODES.includes(docCode as HabDocCode)) {
    return NextResponse.json({ success: false, error: "Código de documento inválido" }, { status: 400 });
  }

  // ── Monta a URL pública aqui no servidor ──────────────────────────────────
  // Usa CLOUDFLARE_R2_PUBLIC_URL (sem NEXT_PUBLIC_) — seguro, disponível server-side
  const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "";
  const fileUrl = `${R2_PUBLIC_URL}/${fileKey}`;

  const habDoc = await db.habilitacaoDoc.upsert({
    where: {
      municipalityId_certameId_code: {
        municipalityId: municipioId,
        certameId: activeCertame.id,
        code: docCode as HabDocCode,
      },
    },
    update: {
      status: "pending",
      rejectReason: null,
    },
    create: {
      municipalityId: municipioId,
      certameId: activeCertame.id,
      code: docCode as HabDocCode,
      status: "pending",
    },
  });

  const file = await db.habilitacaoFile.create({
    data: {
      habDocId:      habDoc.id,
      fileName,
      fileUrl,       // ← URL montada no servidor
      fileKey,
      fileSizeBytes: fileSizeBytes ? Number(fileSizeBytes) : null,
      fileType:      fileType ?? null,
      uploadedBy:    session.user.id,
    },
  });

  return NextResponse.json({ success: true, data: { habDoc, file } }, { status: 201 });
}