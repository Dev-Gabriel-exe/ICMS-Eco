// src/lib/checklist-units.ts
import { db } from "@/lib/db";
import {
  calculateItemPoints,
  countDocumentedUnits,
  countFilledSlots,
} from "@/lib/scoring";
import type { ChecklistItem, Criteria, PerUnitConfig } from "@/types";

/**
 * Recalcula quantity/pointsClaimed dos critérios em que a quantidade é derivada
 * dos documentos: `slotsAsUnits` (1 slot preenchido = 1 unidade) ou
 * `docsPerUnit` (unidade repetível com pacote completo de documentos).
 * Retorna null quando a quantidade é informada manualmente.
 */
export async function syncQuantityFromUnits(checklistItemId: string) {
  const item = await db.checklistItem.findUnique({
    where: { id: checklistItemId },
    include: {
      criteria: { include: { subDocs: true } },
      units: true,
      evidences: true,
    },
  });
  if (!item) return null;

  const cfg = item.criteria.scoringConfig as PerUnitConfig | null;
  if (!cfg || cfg.type !== "per_unit") return null;
  if (!cfg.slotsAsUnits && !cfg.docsPerUnit) return null;

  const quantity = cfg.slotsAsUnits
    ? countFilledSlots(item.criteria.subDocs, item.evidences)
    : countDocumentedUnits(item.units, item.criteria.subDocs, item.evidences);

  const points = calculateItemPoints(
    {
      status: item.status,
      quantity,
      percentageValue: item.percentageValue,
      faixaLevel: item.faixaLevel,
    } as unknown as ChecklistItem,
    item.criteria as unknown as Criteria
  );

  return db.checklistItem.update({
    where: { id: checklistItemId },
    data: { quantity, pointsClaimed: points },
    include: {
      units: { orderBy: { index: "asc" } },
      evidences: true,
    },
  });
}
