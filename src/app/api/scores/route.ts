// src/app/api/scores/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { ChecklistItem, Criteria } from "@/types";
import { auth } from "@/lib/auth";
import { calculateMunicipalityScore } from "@/lib/scoring";
import { db } from "@/lib/db";

// ─── GET /api/scores?municipalityId=&certameId= ────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const municipalityId = searchParams.get("municipalityId");
  const certameId = searchParams.get("certameId");

  if (!municipalityId || !certameId) {
    return NextResponse.json({ success: false, error: "Parâmetros obrigatórios" }, { status: 400 });
  }

  const [municipality, criteria, items] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipalityId } }),
    db.criteria.findMany({ orderBy: { id: "asc" } }),
    db.checklistItem.findMany({
      where: { municipalityId, certameId },
      include: { criteria: true },
    }),
  ]);

  if (!municipality) return NextResponse.json({ success: false, error: "Município não encontrado" }, { status: 404 });

  const score = calculateMunicipalityScore(
    municipalityId,
    certameId,
    criteria as unknown as Criteria[],
    items as unknown as ChecklistItem[],
    municipality.population
  );

  return NextResponse.json({ success: true, data: score });
}
