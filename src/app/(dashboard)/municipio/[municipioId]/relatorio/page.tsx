// src/app/(dashboard)/municipio/[municipioId]/relatorio/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, FileBarChart2, AlertTriangle, Users, CalendarDays,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateMunicipalityScore, getSeloLabel } from "@/lib/scoring";
import { formatDate, formatPopulation } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/relatorio/PrintButton";
import type { ChecklistItem, Criteria } from "@/types";

export const metadata = { title: "Relatório" };

const seloConfig = {
  A: { color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200", label: "Selo A" },
  B: { color: "text-blue-700",    bg: "bg-blue-100 border-blue-200",       label: "Selo B" },
  C: { color: "text-amber-700",   bg: "bg-amber-100 border-amber-200",     label: "Selo C" },
  D: { color: "text-red-700",     bg: "bg-red-100 border-red-200",         label: "Inelegível" },
} as const;

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

  // Sem certame ativo
  if (!activeCertame) {
    return (
      <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Relatório</h1>
            <p className="text-sm text-slate-500 mt-0.5">{municipality.name}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm py-20 flex flex-col items-center gap-4"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}>
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
              <FileBarChart2 className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Nenhum certame ativo.</p>
          </div>
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

  const items = await db.checklistItem.findMany({
    where: { municipalityId: municipioId, certameId: activeCertame.id },
    include: { criteria: true, evidences: true },
  });

  const score = calculateMunicipalityScore(
    municipioId,
    activeCertame.id,
    criteria as unknown as Criteria[],
    items as unknown as ChecklistItem[],
    municipality.population,
  );

  const selo = score.seloEstimado as keyof typeof seloConfig | null;
  const seloCfg = selo ? seloConfig[selo] : seloConfig["D"];

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

        {/* Voltar + Imprimir */}
        <div
          className="flex items-center justify-between mb-8"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}
        >
          <Link
            href={`/municipio/${municipioId}`}
            className="inline-flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 group transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Painel
          </Link>
          <PrintButton />
        </div>

        {/* Cabeçalho do relatório */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5"
          style={{ animation: "fadeSlideUp 0.38s ease both", animationDelay: "40ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
            <FileBarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Relatório ICMS-Eco
            </span>
          </div>

          <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{municipality.name}</h1>
              <p className="text-sm text-slate-500 mt-1">
                ICMS Ecológico · Certame {activeCertame.year} · Decreto 24.288/2025
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {formatDate(activeCertame.periodoInicio)} → {formatDate(activeCertame.periodoFim)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatPopulation(municipality.population)} hab.
                </span>
              </div>
            </div>

            {/* Selo estimado */}
            <div className={cn(
              "rounded-2xl border px-6 py-4 text-center shrink-0",
              seloCfg.bg,
            )}>
              <div className={cn("text-3xl font-black", seloCfg.color)}>
                {selo ? `Selo ${selo}` : "Inelegível"}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {score.criteriaMet} de 9 critérios atingidos
              </div>
            </div>
          </div>
        </div>

        {/* Aviso cláusula de barreira */}
        {!score.a1Compliant && score.criteriaMet >= 6 && (
          <div
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "80ms" }}
          >
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>Cláusula de barreira (art. 8°):</strong> O item A.1 não está comprovado.
              Apesar dos critérios suficientes para Selo A, o município será enquadrado como Selo B5.
            </p>
          </div>
        )}

        {/* Tabela de eixos */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-5"
          style={{ animation: "fadeSlideUp 0.42s ease both", animationDelay: "120ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
              Pontuação por eixo
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {score.axes.length} eixos
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {score.axes.map((axis, i) => (
              <div
                key={axis.axis}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors duration-150",
                  axis.criteriaMet ? "hover:bg-emerald-50/40" : "hover:bg-slate-50/60",
                )}
                style={{
                  animation: "fadeSlideUp 0.35s ease both",
                  animationDelay: `${160 + i * 35}ms`,
                }}
              >
                {/* Badge eixo */}
                <div className={cn(
                  "w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0",
                  axis.criteriaMet ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
                )}>
                  {axis.axis}
                </div>

                {/* Nome + barra */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-semibold text-slate-800 text-sm truncate">{axis.axisName}</span>
                    <span className={cn(
                      "text-sm font-bold shrink-0 tabular-nums",
                      axis.criteriaMet ? "text-emerald-700" : axis.points >= 25 ? "text-amber-600" : "text-red-500",
                    )}>
                      {axis.points} / {axis.maxPoints} pts
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        axis.criteriaMet ? "bg-emerald-500" : axis.progress >= 50 ? "bg-amber-400" : "bg-red-400",
                      )}
                      style={{ width: `${Math.min(axis.progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="shrink-0 flex items-center gap-1.5">
                  {axis.criteriaMet ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> Atingido
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-600">
                      <XCircle className="w-3 h-3" /> Faltam {50 - axis.points} pts
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Totalizador */}
            <div className="flex items-center gap-4 px-6 py-4 bg-slate-50">
              <div className="w-9 h-9 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-700 text-sm">Total geral</span>
              </div>
              <span className="text-sm font-black text-slate-800 tabular-nums shrink-0">
                {score.totalPoints} pts
              </span>
              <div className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-bold border",
                seloCfg.bg, seloCfg.color,
              )}>
                {getSeloLabel(score.seloEstimado)}
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <p
          className="text-center text-xs text-slate-400 mt-2"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "400ms" }}
        >
          Relatório gerado em {formatDate(new Date())} · Sistema ICMS-ECO
        </p>
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