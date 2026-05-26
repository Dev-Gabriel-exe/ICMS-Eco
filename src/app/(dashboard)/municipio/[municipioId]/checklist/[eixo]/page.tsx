// src/app/(dashboard)/municipio/[municipioId]/checklist/[eixo]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ArrowLeft } from "lucide-react";

import CriterionRow from "@/components/checklist/CriterionRow";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { AXIS_NAMES } from "@/lib/constants";
import { calculateAxisScore } from "@/lib/scoring";

import type { Axis, ChecklistItem, Criteria } from "@/types";

export async function generateMetadata({ params }: { params: { municipioId: string; eixo: string } }) {
  return { title: `Eixo ${params.eixo} — Checklist` };
}

export default async function ChecklistEixoPage({
  params,
}: {
  params: { municipioId: string; eixo: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId, eixo } = params;
  const axis = eixo.toUpperCase() as Axis;

  const validAxes = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  if (!validAxes.includes(axis)) notFound();

  const [municipality, activeCertame, axisCriteria] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany({ where: { axis }, orderBy: { id: "asc" } }),
  ]);

  if (!municipality) notFound();

  let items: Awaited<ReturnType<typeof db.checklistItem.findMany>> = [];

  if (activeCertame) {
    items = await db.checklistItem.findMany({
      where: { municipalityId: municipioId, certameId: activeCertame.id, criteria: { axis } },
      include: { criteria: true, evidences: true },
    });
  }

  const axisScore = activeCertame
    ? calculateAxisScore(
        axis,
        axisCriteria as unknown as Criteria[],
        items as unknown as ChecklistItem[],
        municipality.population
      )
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <Link
        href={`/municipio/${municipioId}/checklist`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Todos os eixos
      </Link>

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
              ${axisScore?.criteriaMet ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-700"}`}>
              {axis}
            </div>
            <h1 className="text-xl font-semibold text-surface-900">
              {AXIS_NAMES[axis]}
            </h1>
          </div>
          <p className="text-sm text-surface-500">Pontuação mínima: 50 pts · {municipality.name}</p>
        </div>

        {axisScore && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${axisScore.criteriaMet ? "text-green-700" : "text-surface-700"}`}>
              {axisScore.points} pts
            </div>
            <div className={`text-xs font-medium ${axisScore.criteriaMet ? "text-green-600" : "text-red-600"}`}>
              {axisScore.criteriaMet ? "✓ Critério atingido" : `Faltam ${50 - axisScore.points} pts`}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {axisScore && (
        <div className="mb-6 h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${axisScore.criteriaMet ? "bg-green-500" : axisScore.progress >= 25 ? "bg-amber-500" : "bg-red-400"}`}
            style={{ width: `${Math.min(axisScore.progress, 100)}%` }}
          />
        </div>
      )}

      {/* Critérios */}
      {!activeCertame ? (
        <div className="card p-8 text-center text-surface-400">
          Nenhum certame ativo.
        </div>
      ) : (
        <div className="space-y-3">
          {axisCriteria.map((criterion) => {
            const item = items.find((i) => i.criteriaId === criterion.id);
            return (
              <CriterionRow
                key={criterion.id}
                criterion={criterion as unknown as Criteria}
                item={item as unknown as ChecklistItem | undefined}
                municipalityId={municipioId}
                certameId={activeCertame.id}
                population={municipality.population}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
