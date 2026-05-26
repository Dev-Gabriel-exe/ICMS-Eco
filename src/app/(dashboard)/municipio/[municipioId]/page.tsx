// src/app/(dashboard)/municipio/[municipioId]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  
  calculateMunicipalityScore,
  getSeloLabel,
  
} from "@/lib/scoring";
import { formatPopulation } from "@/lib/utils";
import type { ChecklistItem, Criteria } from "@/types";
import { AlertTriangle, CheckCircle2, Circle, ChevronRight } from "lucide-react";

export async function generateMetadata({ params }: { params: { municipioId: string } }) {
  const m = await db.municipality.findUnique({ where: { id: params.municipioId } });
  return { title: m?.name ?? "Município" };
}

export default async function MunicipioDashboardPage({
  params,
}: {
  params: { municipioId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  // Verifica acesso
  if (session.user.role !== "admin") {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) notFound();
  }

  const [municipality, activeCertame, criteria] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!municipality) notFound();

  let score = null;
  let items: Awaited<ReturnType<typeof db.checklistItem.findMany>> = [];

  if (activeCertame) {
    items = await db.checklistItem.findMany({
      where: { municipalityId: municipioId, certameId: activeCertame.id },
      include: { criteria: true },
    });

    score = calculateMunicipalityScore(
      municipioId,
      activeCertame.id,
      criteria as unknown as Criteria[],
      items as unknown as ChecklistItem[],
      municipality.population
    );
  }

  const seloColors: Record<string, string> = {
    A: "bg-green-600",
    B: "bg-blue-600",
    C: "bg-amber-600",
    none: "bg-red-500",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{municipality.name}</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {formatPopulation(municipality.population)} habitantes
            {municipality.ibgeCode && ` · IBGE ${municipality.ibgeCode}`}
          </p>
        </div>

        {score && (
          <div className={`px-4 py-2 rounded-xl text-white font-bold text-lg ${seloColors[score.seloEstimado ?? "none"]}`}>
            {score.seloEstimado ? getSeloLabel(score.seloEstimado) : "Inelegível"}
          </div>
        )}
      </div>

      {/* Alerta sem certame */}
      {!activeCertame && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Nenhum certame ativo. Aguarde o administrador abrir um certame para começar.
          </p>
        </div>
      )}

      {/* Alerta A.1 sem comprovação */}
      {score && score.criteriaMet >= 6 && !score.a1Compliant && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>Atenção — Cláusula de barreira (art. 8°):</strong> Este município atingiu
            critérios suficientes para o Selo A, mas o item A.1 (aterro sanitário) não está
            comprovado. Sem A.1, o município será enquadrado como <strong>Selo B5</strong>.
          </p>
        </div>
      )}

      {/* Score summary */}
      {score && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-surface-900">{score.totalPoints}</div>
            <div className="text-xs text-surface-500 mt-1">Pontos totais</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-surface-900">{score.criteriaMet}</div>
            <div className="text-xs text-surface-500 mt-1">Critérios atingidos</div>
          </div>
          <div className="card p-4 text-center">
            <div className={`text-3xl font-bold ${score.seloEstimado ? "text-green-700" : "text-red-600"}`}>
              {score.seloEstimado ?? "—"}
            </div>
            <div className="text-xs text-surface-500 mt-1">Selo estimado</div>
          </div>
        </div>
      )}

      {/* Eixos */}
      {activeCertame && score && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-surface-800">Progresso por eixo</h2>
            <Link
              href={`/municipio/${municipioId}/checklist`}
              className="text-brand-600 text-sm font-medium hover:text-brand-700"
            >
              Ver checklist →
            </Link>
          </div>
          <div className="divide-y divide-surface-100">
            {score.axes.map((axis) => (
              <Link
                key={axis.axis}
                href={`/municipio/${municipioId}/checklist/${axis.axis}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 transition-colors"
              >
                {/* Eixo badge */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0
                  ${axis.criteriaMet ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"}`}>
                  {axis.axis}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-800 truncate">{axis.axisName}</span>
                    <span className={`text-sm font-semibold ml-2 shrink-0
                      ${axis.criteriaMet ? "text-green-700" : axis.points > 0 ? "text-amber-700" : "text-surface-400"}`}>
                      {axis.points}/{axis.maxPoints} pts
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500
                        ${axis.criteriaMet ? "bg-green-500" : axis.progress >= 25 ? "bg-amber-500" : "bg-red-400"}`}
                      style={{ width: `${axis.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {axis.criteriaMet ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : axis.points > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-surface-300" />
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-surface-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
