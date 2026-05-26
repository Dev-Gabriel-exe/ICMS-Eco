// src/app/api/checklist/route.ts
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { calculateItemPoints } from "@/lib/scoring";

import type { ChecklistItem, Criteria } from "@/types";
// ─── GET /api/checklist?municipalityId=&certameId= ─────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const municipalityId = searchParams.get("municipalityId");
  const certameId = searchParams.get("certameId");

  if (!municipalityId || !certameId) {
    return NextResponse.json({ success: false, error: "municipalityId e certameId são obrigatórios" }, { status: 400 });
  }

  // Verifica acesso ao município
  if (session.user.role !== "admin") {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId } },
    });
    if (!link) return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const items = await db.checklistItem.findMany({
    where: { municipalityId, certameId },
    include: { criteria: true, evidences: true },
    orderBy: { criteriaId: "asc" },
  });

  return NextResponse.json({ success: true, data: items });
}

// ─── PATCH /api/checklist — atualiza ou cria um item ──────────────────────

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const { municipalityId, certameId, criteriaId, status, quantity, percentageValue, faixaLevel, mapLink, notes } = body;

  if (!municipalityId || !certameId || !criteriaId) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
  }

  // Busca critério para calcular pontos
  const criteria = await db.criteria.findUnique({ where: { id: criteriaId } });
  if (!criteria) return NextResponse.json({ success: false, error: "Critério não encontrado" }, { status: 404 });

  const municipality = await db.municipality.findUnique({ where: { id: municipalityId } });
  if (!municipality) return NextResponse.json({ success: false, error: "Município não encontrado" }, { status: 404 });

  // Calcula pontos
  const fakeItem = { status, quantity, percentageValue, faixaLevel } as unknown as ChecklistItem;
  const points = calculateItemPoints(fakeItem, criteria as unknown as Criteria, municipality.population);

  const item = await db.checklistItem.upsert({
    where: { municipalityId_certameId_criteriaId: { municipalityId, certameId, criteriaId } },
    update: {
      status,
      quantity: quantity ?? null,
      percentageValue: percentageValue ?? null,
      faixaLevel: faixaLevel ?? null,
      mapLink: mapLink ?? null,
      notes: notes ?? null,
      pointsClaimed: points,
      updatedBy: session.user.id,
    },
    create: {
      municipalityId,
      certameId,
      criteriaId,
      status: status ?? "not_started",
      quantity: quantity ?? null,
      percentageValue: percentageValue ?? null,
      faixaLevel: faixaLevel ?? null,
      mapLink: mapLink ?? null,
      notes: notes ?? null,
      pointsClaimed: points,
      updatedBy: session.user.id,
    },
    include: { criteria: true },
  });

  return NextResponse.json({ success: true, data: item });
}
