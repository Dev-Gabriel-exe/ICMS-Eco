// src/app/(dashboard)/municipio/[municipioId]/relatorio/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Printer,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { calculateMunicipalityScore, getSeloLabel } from "@/lib/scoring";

import { formatDate, formatPopulation } from "@/lib/utils";

import type { ChecklistItem, Criteria } from "@/types";
export const metadata = { title: "Relatório" };

export default async function RelatorioPage({
  params,
}: {
  params: { municipioId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  const [municipality, activeCertame, criteria] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!municipality) notFound();
  if (!activeCertame) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Relatório — {municipality.name}</h1>
        <div className="card p-8 text-center text-surface-400">Nenhum certame ativo.</div>
      </div>
    );
  }

  const items = await db.checklistItem.findMany({
    where: { municipalityId: municipioId, certameId: activeCertame.id },
    include: { criteria: true, evidences: true },
  });

  const score = calculateMunicipalityScore(
    municipioId,
    activeCertame.id,
    criteria as unknown as Criteria[],
    items as unknown as ChecklistItem[],
    municipality.population
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/municipio/${municipioId}`}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft className="w-4 h-4" /> Painel
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary btn-sm no-print"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* Cabeçalho do relatório */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{municipality.name}</h1>
            <p className="text-sm text-surface-500 mt-1">
              ICMS Ecológico · Certame {activeCertame.year} · Decreto 24.288/2025
            </p>
            <p className="text-xs text-surface-400 mt-0.5">
              Período: {formatDate(activeCertame.periodoInicio)} a {formatDate(activeCertame.periodoFim)} ·
              Pop. {formatPopulation(municipality.population)} hab.
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${
              score.seloEstimado === "A" ? "text-green-600" :
              score.seloEstimado === "B" ? "text-blue-600" :
              score.seloEstimado === "C" ? "text-amber-600" : "text-red-600"
            }`}>
              {score.seloEstimado ? `Selo ${score.seloEstimado}` : "Inelegível"}
            </div>
            <div className="text-sm text-surface-500">{score.criteriaMet} de 9 critérios</div>
          </div>
        </div>
      </div>

      {/* Tabela resumo por eixo */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="font-semibold text-surface-800">Resumo de pontuação por eixo</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Eixo</th>
              <th>Critério</th>
              <th>Pontos</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {score.axes.map((axis) => (
              <tr key={axis.axis}>
                <td>
                  <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold
                    ${axis.criteriaMet ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"}`}>
                    {axis.axis}
                  </div>
                </td>
                <td className="text-surface-700">{axis.axisName}</td>
                <td className="font-semibold">{axis.points} / {axis.maxPoints}</td>
                <td>
                  {axis.criteriaMet ? (
                    <span className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Atingido
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
                      <XCircle className="w-4 h-4" /> Não atingido (faltam {50 - axis.points} pts)
                    </span>
                  )}
                </td>
              </tr>
            ))}
            <tr className="bg-surface-50 font-semibold">
              <td colSpan={2}>Total</td>
              <td>{score.totalPoints} pts</td>
              <td>{getSeloLabel(score.seloEstimado)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Avisos */}
      {!score.a1Compliant && score.criteriaMet >= 6 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <strong>⚠️ Cláusula de barreira (art. 8°):</strong> O item A.1 não está comprovado.
          Apesar dos critérios suficientes para Selo A, o município será enquadrado como Selo B5.
        </div>
      )}

      <p className="text-xs text-surface-400 mt-6 text-center">
        Relatório gerado em {formatDate(new Date())} · Sistema ICMS-ECO 
      </p>
    </div>
  );
}
