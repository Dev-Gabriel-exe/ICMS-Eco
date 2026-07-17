// src/app/(dashboard)/municipio/[municipioId]/checklist/[eixo]/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ClipboardList } from "lucide-react";
import CriterionRow from "@/components/checklist/CriterionRow";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AXIS_NAMES } from "@/lib/constants";
import { calculateAxisScore } from "@/lib/scoring";
import { cn, sortByCriteriaId } from "@/lib/utils";
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

  const [municipality, activeCertame, axisCriteriaRaw] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany({
      where: { axis },
      include: { subDocs: { orderBy: { order: "asc" } } },
    }),
  ]);
  const axisCriteria = sortByCriteriaId(axisCriteriaRaw);

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
        municipality.population,
      )
    : null;

  const barColor = axisScore
    ? axisScore.criteriaMet
      ? "bg-emerald-500"
      : axisScore.progress >= 50
        ? "bg-amber-400"
        : "bg-red-400"
    : "bg-slate-200";

  const axisBadgeColor = axisScore?.criteriaMet
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-600";

  const pointsColor = axisScore
    ? axisScore.criteriaMet
      ? "text-emerald-700"
      : axisScore.points >= 25
        ? "text-amber-600"
        : "text-red-500"
    : "text-slate-500";

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">
      {/* Blobs */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-30"
        style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20"
        style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-4xl mx-auto">

        {/* Voltar */}
        <Link
          href={`/municipio/${municipioId}`}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 mb-6 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Voltar ao painel
        </Link>

        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 mb-6"
          style={{ animation: "fadeSlideUp 0.38s ease both", animationDelay: "40ms" }}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0",
              axisBadgeColor,
            )}>
              {axis}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {AXIS_NAMES[axis]}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {municipality.name} · pontuação mínima: 50 pts
              </p>
            </div>
          </div>

          {axisScore && (
            <div className="text-right shrink-0">
              <div className={cn("text-2xl font-bold", pointsColor)}>
                {axisScore.points} pts
              </div>
              <div className={cn(
                "text-xs font-semibold mt-0.5",
                axisScore.criteriaMet ? "text-emerald-600" : "text-red-500",
              )}>
                {axisScore.criteriaMet
                  ? "✓ Critério atingido"
                  : `Faltam ${50 - axisScore.points} pts`}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {axisScore && (
          <div
            className="mb-7"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "80ms" }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">Progresso</span>
              <span className="text-xs text-slate-500 font-semibold tabular-nums">
                {Math.min(axisScore.progress, 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", barColor)}
                style={{ width: `${Math.min(axisScore.progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Sem certame */}
        {!activeCertame ? (
          <div
            className="rounded-3xl border border-slate-200 bg-white shadow-sm py-20 flex flex-col items-center gap-4"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "100ms" }}
          >
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Nenhum certame ativo.</p>
          </div>
        ) : (
          /* Card com critérios */
          <div
            className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "120ms" }}
          >
            {/* Header do card */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  Critérios do eixo {axis}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {axisCriteria.length} critério{axisCriteria.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Lista de critérios */}
            <div className="divide-y divide-slate-100 p-4 space-y-2">
              {axisCriteria.map((criterion, i) => {
                const item = items.find((it) => it.criteriaId === criterion.id);
                return (
                  <div
                    key={criterion.id}
                    style={{
                      animation: "fadeSlideUp 0.35s ease both",
                      animationDelay: `${160 + i * 40}ms`,
                    }}
                  >
                    <CriterionRow
                      criterion={criterion as unknown as Criteria}
                      item={item as unknown as ChecklistItem | undefined}
                      municipalityId={municipioId}
                      certameId={activeCertame.id}
                      population={municipality.population}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
