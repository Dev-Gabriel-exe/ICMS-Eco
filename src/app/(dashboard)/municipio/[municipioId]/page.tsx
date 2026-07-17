// src/app/(dashboard)/municipio/[municipioId]/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateMunicipalityScore, getSeloLabel } from "@/lib/scoring";
import { cn, formatPopulation, sortByCriteriaId } from "@/lib/utils";
import type { ChecklistItem, Criteria } from "@/types";
import {
  AlertTriangle, CheckCircle2, Circle, ChevronRight,
  Building2, Users, Hash, ClipboardList, FileBarChart2,
  FileText, TrendingUp, FileCheck,
  ArrowLeft,
} from "lucide-react";

export async function generateMetadata({ params }: { params: { municipioId: string } }) {
  const m = await db.municipality.findUnique({ where: { id: params.municipioId } });
  return { title: m?.name ?? "Município" };
}

const seloConfig = {
  A: { color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-200" },
  B: { color: "text-blue-700",    bg: "bg-blue-100 border-blue-200"       },
  C: { color: "text-amber-700",   bg: "bg-amber-100 border-amber-200"     },
  D: { color: "text-red-700",     bg: "bg-red-100 border-red-200"         },
} as const;

export default async function MunicipioDashboardPage({
  params,
  searchParams,
}: {
  params: { municipioId: string };
  searchParams?: { backTo?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  if (session.user.role !== "admin") {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) notFound();
  }

  const [municipality, activeCertame, criteriaRaw] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany(),
  ]);
  const criteria = sortByCriteriaId(criteriaRaw);

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
      municipality.population,
    );
  }

  const selo = score?.seloEstimado as keyof typeof seloConfig | null | undefined;
  const seloCfg = selo ? seloConfig[selo] : seloConfig["D"];
  const backTo = typeof searchParams?.backTo === "string" && searchParams.backTo.startsWith("/")
    ? searchParams.backTo
    : "/municipio";
  const backLabel = {
    "/municipio": "Painel Geral",
    "/admin/municipios": "Municípios",
    "/admin": "Painel admin",
  }[backTo] ?? "Voltar";

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

      <div className="relative max-w-5xl mx-auto">

        {/* Voltar */}
        <Link
          href={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 mb-6 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {backLabel}
        </Link>

        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 mb-7"
          style={{ animation: "fadeSlideUp 0.4s ease both" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{municipality.name}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {formatPopulation(municipality.population)} hab.
                </span>
                {municipality.ibgeCode && (
                  <span className="flex items-center gap-1 font-mono">
                    <Hash className="w-3 h-3" />
                    {municipality.ibgeCode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Selo estimado */}
          {score && (
            <div className={cn(
              "rounded-2xl border px-5 py-3 text-center shrink-0",
              seloCfg.bg,
            )}>
              <div className={cn("text-xl font-black", seloCfg.color)}>
                {score.seloEstimado ? getSeloLabel(score.seloEstimado) : "Inelegível"}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                Certame {activeCertame?.year}
              </div>
            </div>
          )}
        </div>

        {/* Alerta sem certame */}
        {!activeCertame && (
          <div
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">
              Nenhum certame ativo. Aguarde o administrador abrir um certame para começar.
            </p>
          </div>
        )}

        {/* Alerta cláusula de barreira */}
        {score && score.criteriaMet >= 6 && !score.a1Compliant && (
          <div
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
          >
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>Cláusula de barreira (art. 8°):</strong> Este município atingiu critérios
              suficientes para o Selo A, mas o item A.1 (aterro sanitário) não está comprovado.
              Sem A.1, o município será enquadrado como <strong>Selo B5</strong>.
            </p>
          </div>
        )}

        {/* Stat cards */}
        {score && (
          <div
            className="grid grid-cols-3 gap-4 mb-6"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "80ms" }}
          >
            {[
              { label: "Pontos totais", value: score.totalPoints, color: "text-slate-700", bg: "bg-white border-slate-200", icon: TrendingUp },
              { label: "Critérios atingidos", value: `${score.criteriaMet} / 9`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
              { label: "Selo estimado", value: score.seloEstimado ?? "—", color: seloCfg.color, bg: cn(seloCfg.bg), icon: null },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-2xl border px-5 py-4", s.bg)}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Links rápidos */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "120ms" }}
        >
          {[
            
            { href: `/municipio/${municipioId}/evidencias`,                    icon: FileText,      label: "Evidências",  desc: "Arquivos enviados"     },
            { href: `/municipio/${municipioId}/relatorio`,                     icon: FileBarChart2, label: "Relatório",   desc: "Pontuação detalhada"   },
            {
  href: `/municipio/${municipioId}/habilitacao`,
  icon: FileCheck,
  label: "Habilitação",
  desc: "Enviar documentos",
}
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 hover:-translate-y-0.5 transition-all duration-150 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors duration-150 shrink-0" />
            </Link>
          ))}
        </div>

        {/* Progresso por eixo */}
        {activeCertame && score && (
          <div
            className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "160ms" }}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white">
  <div className="flex items-center gap-2">
    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
      Progresso por eixo
    </span>
  </div>
</div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {score.axes.map((axis, i) => (
                <Link
                  key={axis.axis}
                  href={`/municipio/${municipioId}/checklist/${axis.axis}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-emerald-50/40 transition-colors duration-150 group"
                  style={{
                    animation: "fadeSlideUp 0.35s ease both",
                    animationDelay: `${200 + i * 35}ms`,
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
                    <div className="flex items-center justify-between mb-1.5 gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">{axis.axisName}</span>
                      <span className={cn(
                        "text-sm font-bold shrink-0 tabular-nums",
                        axis.criteriaMet ? "text-emerald-700" : axis.points > 0 ? "text-amber-600" : "text-slate-400",
                      )}>
                        {axis.points}/{axis.maxPoints} pts
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

                  {/* Status + chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {axis.criteriaMet ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : axis.points > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors duration-150" />
                  </div>
                </Link>
              ))}
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
