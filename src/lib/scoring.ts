// src/lib/scoring.ts
import type {
  Axis,
  AxisScore,
  ChecklistItem,
  Criteria,
  FaixaC5,
  MunicipalityScore,
  PerFaixaConfigC5,
  PerFaixaConfigTerritory,
  PerUnitConfig,
  PercentageConfig,
  SeloCategory,
  ScoringConfig,
  TerritoryRange,
  WeightedScore,
} from "@/types";

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

export const AXIS_MIN_POINTS = 50;

export const AXIS_NAMES: Record<Axis, string> = {
  A: "Gerenciamento de Resíduos Sólidos",
  B: "Educação Ambiental",
  C: "Redução do Desmatamento e Recuperação de Áreas Degradadas",
  D: "Redução do Risco de Queimadas, Conservação do Solo e da Biodiversidade",
  E: "Proteção de Mananciais de Abastecimento Público",
  F: "Controle da Poluição e Regularidade Ambiental Municipal",
  G: "Edificações Irregulares",
  H: "Unidades de Conservação",
  I: "Legislação sobre a Política Municipal de Meio Ambiente",
};

export const AXES: Axis[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

// ─────────────────────────────────────────────
// 1. Pontuação individual por sub-critério
// ─────────────────────────────────────────────

/**
 * Calcula pontos de um ChecklistItem conforme o tipo de pontuação do critério.
 * Retorna 0 se o item não estiver completo.
 */
export function calculateItemPoints(
  item: ChecklistItem,
  criteria: Criteria,
  municipalityPopulation?: number
): number {
  if (item.status !== "complete") return 0;

  const cfg = criteria.scoringConfig as ScoringConfig;

  switch (criteria.scoringType) {
    // ── Fixo: pontuação total do critério ──────
    case "fixed": {
      return criteria.maxPoints;
    }

    // ── Por unidade: qtd × valor_unitário ──────
    case "per_unit": {
      if (!cfg || !("unitValue" in cfg)) return 0;
      const config = cfg as PerUnitConfig;
      const qty = item.quantity ?? 1;
      return Math.min(qty * config.unitValue, config.maxPoints);
    }

    // ── Percentagem: valor × coeficiente ───────
    case "percentage": {
      if (!cfg || !("coefficient" in cfg)) return 0;
      const config = cfg as PercentageConfig;
      const pct = Number(item.percentageValue ?? 0);
      return Math.min(pct * config.coefficient, config.maxPoints);
    }

    // ── Por faixa: population (C.5) ou territory (H.1, H.3) ──
    case "per_faixa": {
      if (!cfg) return 0;

      if ("type" in cfg && cfg.type === "population") {
        return calculateC5Points(cfg as PerFaixaConfigC5, municipalityPopulation ?? 0, item.faixaLevel ?? 0);
      }

      if ("type" in cfg && cfg.type === "territory") {
        return calculateTerritoryPoints(cfg as PerFaixaConfigTerritory, Number(item.percentageValue ?? 0));
      }

      return 0;
    }

    default:
      return 0;
  }
}

// ─────────────────────────────────────────────
// 1a. C.5 — Plantio por faixa populacional
// ─────────────────────────────────────────────

export function calculateC5Points(
  config: PerFaixaConfigC5,
  population: number,
  level: number // 1, 2 ou 3
): number {
  const faixa = config.faixas.find(
    (f) =>
      population >= f.minPop &&
      (f.maxPop === null || population <= f.maxPop)
  );

  if (!faixa) return 0;

  const lvl = faixa.levels.find((l) => l.level === level);
  return lvl?.points ?? 0;
}

/** Retorna a faixa populacional de C.5 para um dado município */
export function getC5Faixa(config: PerFaixaConfigC5, population: number): FaixaC5 | null {
  return (
    config.faixas.find(
      (f) => population >= f.minPop && (f.maxPop === null || population <= f.maxPop)
    ) ?? null
  );
}

// ─────────────────────────────────────────────
// 1b. H.1 e H.3 — Por % do território
// ─────────────────────────────────────────────

export function calculateTerritoryPoints(
  config: PerFaixaConfigTerritory,
  pct: number
): number {
  const range = config.ranges.find(
    (r) => pct >= r.minPct && (r.maxPct === null || pct <= r.maxPct)
  );
  return range?.points ?? 0;
}

export function getTerritoryRange(
  config: PerFaixaConfigTerritory,
  pct: number
): TerritoryRange | null {
  return (
    config.ranges.find(
      (r) => pct >= r.minPct && (r.maxPct === null || pct <= r.maxPct)
    ) ?? null
  );
}

// ─────────────────────────────────────────────
// 2. Pontuação por eixo
// ─────────────────────────────────────────────

export function calculateAxisScore(
  axis: Axis,
  criteriaList: Criteria[],
  checklistItems: ChecklistItem[],
  municipalityPopulation: number
): AxisScore {
  const axisCriteria = criteriaList.filter((c) => c.axis === axis);
  const axisMaxPoints = axisCriteria.reduce((sum, c) => sum + c.maxPoints, 0);

  let totalPoints = 0;
  let itemsComplete = 0;

  for (const criteria of axisCriteria) {
    const item = checklistItems.find((i) => i.criteriaId === criteria.id);
    if (!item) continue;

    const pts = calculateItemPoints(item, criteria, municipalityPopulation);
    totalPoints += pts;
    if (item.status === "complete") itemsComplete++;
  }

  // Eixo H: cap em 100 pts (máx. pode ultrapassar por bônus H.7)
  const cappedPoints = axis === "H" ? Math.min(totalPoints, 100) : totalPoints;
  const cappedMax = axis === "H" ? 100 : axisMaxPoints;

  return {
    axis,
    axisName: AXIS_NAMES[axis],
    points: cappedPoints,
    maxPoints: cappedMax,
    criteriaMet: cappedPoints >= AXIS_MIN_POINTS,
    progress: Math.min(Math.round((cappedPoints / cappedMax) * 100), 100),
    itemsComplete,
    itemsTotal: axisCriteria.length,
  };
}

// ─────────────────────────────────────────────
// 3. Score completo do município
// ─────────────────────────────────────────────

export function calculateMunicipalityScore(
  municipalityId: string,
  certameId: string,
  criteriaList: Criteria[],
  checklistItems: ChecklistItem[],
  population: number
): MunicipalityScore {
  const axes = AXES.map((axis) =>
    calculateAxisScore(axis, criteriaList, checklistItems, population)
  );

  const criteriaMet = axes.filter((a) => a.criteriaMet).length;
  const totalPoints = axes.reduce((sum, a) => sum + a.points, 0);

  // Verifica A.1 (obrigatório para Selo A a partir de 2027)
  const a1Item = checklistItems.find((i) => i.criteriaId === "A.1");
  const a1Compliant = a1Item?.status === "complete";

  const seloEstimado = getSeloCategory(criteriaMet, a1Compliant);

  return {
    municipalityId,
    certameId,
    axes,
    totalPoints,
    criteriaMet,
    seloEstimado,
    a1Compliant,
  };
}

// ─────────────────────────────────────────────
// 4. Classificação do Selo
// ─────────────────────────────────────────────

/**
 * Art. 7° + Art. 8° (cláusula de barreira A.1)
 */
export function getSeloCategory(
  criteriaMet: number,
  a1Compliant: boolean = true
): SeloCategory {
  if (criteriaMet >= 6) {
    // A partir de 2027, Selo A exige A.1
    if (!a1Compliant) return "B"; // enquadrado em B5 (art. 8°)
    return "A";
  }
  if (criteriaMet === 4 || criteriaMet === 5) return "B";
  if (criteriaMet === 3) return "C";
  return null;
}

// ─────────────────────────────────────────────
// 5. Média ponderada (a partir de 2029)
// Art. 5° e 6°
// ─────────────────────────────────────────────

interface YearScore {
  points: number;
  criteriaCount: number;
}

/**
 * Calcula a Pontuação Final Ponderada (PFP) e
 * o Número Final de Critérios Ponderados (NFCP).
 *
 * - ano: peso 3
 * - ano-1: peso 2
 * - ano-2: peso 1
 * - não participou → points=1, criteriaCount=1
 */
export function calculateWeightedScore(
  yearN: YearScore,
  yearN1: YearScore | null,
  yearN2: YearScore | null
): WeightedScore {
  const pN = yearN.points;
  const pN1 = yearN1?.points ?? 1;
  const pN2 = yearN2?.points ?? 1;

  const rawPFP = (pN * 3 + pN1 * 2 + pN2 * 1) / 6;
  const pfp = Math.round(rawPFP); // arredondamento matemático padrão (§ 2° do art. 5°)

  // NFCP — art. 6° com regra de arredondamento por desempenho
  const cN = yearN.criteriaCount;
  const cN1 = yearN1?.criteriaCount ?? 1;
  const cN2 = yearN2?.criteriaCount ?? 1;

  const rawNFCP = (cN * 3 + cN1 * 2 + cN2 * 1) / 6;
  let nfcp: number;

  if (Number.isInteger(rawNFCP)) {
    nfcp = rawNFCP;
  } else {
    // Etapa 1: parte inteira (truncada)
    const intPart = Math.floor(rawNFCP);
    // Etapa 2: acresce 1 se desempenho atual > parte inteira
    nfcp = cN > intPart ? intPart + 1 : intPart;
  }

  const seloFinal = getSeloCategory(nfcp);

  return { pfp, nfcp, seloFinal };
}

// ─────────────────────────────────────────────
// 6. Utilitários de display
// ─────────────────────────────────────────────

export function formatPoints(pts: number): string {
  return pts.toFixed(0);
}

export function getSeloLabel(selo: SeloCategory): string {
  if (!selo) return "Sem Selo";
  return `Selo ${selo}`;
}

export function getSeloColor(selo: SeloCategory): string {
  switch (selo) {
    case "A": return "brand";
    case "B": return "blue";
    case "C": return "amber";
    default:  return "red";
  }
}

export function getStatusLabel(status: ChecklistItem["status"]): string {
  switch (status) {
    case "complete":
      return "Completo";

    case "in_progress":
      return "Em andamento";

    case "not_started":
      return "Não iniciado";

    default:
      return "Desconhecido";
  }
}

export function getStatusColor(status: ChecklistItem["status"]): string {
  switch (status) {
    case "complete":
      return "text-green-700 bg-green-50 border-green-200";

    case "in_progress":
      return "text-amber-700 bg-amber-50 border-amber-200";

    case "not_started":
      return "text-slate-500 bg-slate-50 border-slate-200";

    default:
      return "text-slate-500 bg-slate-50 border-slate-200";
  }
}