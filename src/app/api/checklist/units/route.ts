// src/app/api/checklist/units/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncQuantityFromUnits } from "@/lib/checklist-units";
import type { PerUnitConfig } from "@/types";

function getMaxUnits(criteria: { scoringConfig: unknown; maxPoints: number }): number {
  const cfg = criteria.scoringConfig as PerUnitConfig | null;
  if (!cfg || cfg.type !== "per_unit" || !cfg.unitValue) return 0;
  return Math.floor((cfg.maxPoints ?? criteria.maxPoints) / cfg.unitValue);
}

// GET /api/checklist/units?checklistItemId=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const checklistItemId = req.nextUrl.searchParams.get("checklistItemId");
  if (!checklistItemId) {
    return NextResponse.json({ success: false, error: "checklistItemId obrigatório" }, { status: 400 });
  }

  const units = await db.checklistUnit.findMany({
    where: { checklistItemId },
    orderBy: { index: "asc" },
  });

  return NextResponse.json({ success: true, data: units });
}

// POST /api/checklist/units — cria unidade (e checklist item se necessário)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { municipalityId, certameId, criteriaId, title } = body as {
    municipalityId?: string;
    certameId?: string;
    criteriaId?: string;
    title?: string | null;
  };

  if (!municipalityId || !certameId || !criteriaId) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
  }

  const criteria = await db.criteria.findUnique({ where: { id: criteriaId } });
  if (!criteria) {
    return NextResponse.json({ success: false, error: "Critério não encontrado" }, { status: 404 });
  }

  const cfg = criteria.scoringConfig as PerUnitConfig | null;
  if (!cfg || cfg.type !== "per_unit" || !cfg.docsPerUnit) {
    return NextResponse.json(
      { success: false, error: "Este critério não usa unidades documentais" },
      { status: 400 }
    );
  }

  const maxUnits = getMaxUnits(criteria);

  const checklistItem = await db.checklistItem.upsert({
    where: {
      municipalityId_certameId_criteriaId: { municipalityId, certameId, criteriaId },
    },
    update: {},
    create: {
      municipalityId,
      certameId,
      criteriaId,
      status: "in_progress",
      updatedBy: session.user.id,
    },
    include: { units: true },
  });

  if (checklistItem.units.length >= maxUnits) {
    return NextResponse.json(
      { success: false, error: `Máximo de ${maxUnits} unidades permitido` },
      { status: 400 }
    );
  }

  const nextIndex =
    checklistItem.units.length === 0
      ? 1
      : Math.max(...checklistItem.units.map((u) => u.index)) + 1;

  const unit = await db.checklistUnit.create({
    data: {
      checklistItemId: checklistItem.id,
      index: nextIndex,
      title: title?.trim() || null,
    },
  });

  const updatedItem = await syncQuantityFromUnits(checklistItem.id);

  return NextResponse.json({
    success: true,
    data: { unit, checklistItem: updatedItem },
  });
}

// PATCH /api/checklist/units — atualiza título
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { unitId, title } = await req.json();
  if (!unitId) {
    return NextResponse.json({ success: false, error: "unitId obrigatório" }, { status: 400 });
  }

  const unit = await db.checklistUnit.update({
    where: { id: unitId },
    data: { title: typeof title === "string" ? title.trim() || null : null },
  });

  return NextResponse.json({ success: true, data: unit });
}

// DELETE /api/checklist/units?unitId=
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const unitId = req.nextUrl.searchParams.get("unitId");
  if (!unitId) {
    return NextResponse.json({ success: false, error: "unitId obrigatório" }, { status: 400 });
  }

  const unit = await db.checklistUnit.findUnique({ where: { id: unitId } });
  if (!unit) {
    return NextResponse.json({ success: false, error: "Unidade não encontrada" }, { status: 404 });
  }

  const checklistItemId = unit.checklistItemId;
  await db.checklistUnit.delete({ where: { id: unitId } });

  // Reindexa 1..N
  const remaining = await db.checklistUnit.findMany({
    where: { checklistItemId },
    orderBy: { index: "asc" },
  });
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].index !== i + 1) {
      await db.checklistUnit.update({
        where: { id: remaining[i].id },
        data: { index: i + 1 },
      });
    }
  }

  const updatedItem = await syncQuantityFromUnits(checklistItemId);

  return NextResponse.json({
    success: true,
    data: { checklistItem: updatedItem },
  });
}
