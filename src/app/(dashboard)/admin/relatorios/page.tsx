// src/app/(dashboard)/admin/relatorios/page.tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Building2, Users, FileCheck, Clock3, TrendingUp,
  Award, ChevronRight, FileBarChart2, CheckCircle2,
  XCircle, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Relatórios Gerais" };

async function getData() {
  const [
    municipalities, activeMunicipalities, users, activeCertame,
    pendingEvidences, approvedEvidences, rejectedEvidences,
  ] = await Promise.all([
    db.municipality.count(),
    db.municipality.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: true } }),
    db.certame.findFirst({ where: { isActive: true, isClosed: false }, orderBy: { year: "desc" } }),
    db.evidence.count({ where: { validationStatus: "pending" } }),
    db.evidence.count({ where: { validationStatus: "approved" } }),
    db.evidence.count({ where: { validationStatus: "rejected" } }),
  ]);
  return { municipalities, activeMunicipalities, users, activeCertame, pendingEvidences, approvedEvidences, rejectedEvidences };
}

export default async function RelatoriosPage() {
  await requireAdmin();
  const stats = await getData();
  const totalEvidences = stats.pendingEvidences + stats.approvedEvidences + stats.rejectedEvidences;

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

      <div className="relative max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
            >
              <FileBarChart2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Relatórios Gerais</h1>
              <p className="text-sm text-slate-500 mt-0.5">Visão consolidada do sistema ICMS-ECO</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
        >
          {[
            { icon: Building2, label: "Municípios", value: stats.municipalities, sub: `${stats.activeMunicipalities} ativos`, color: "green" as const },
            { icon: Users,     label: "Usuários",   value: stats.users,          sub: "Funcionários ativos",               color: "blue" as const },
            { icon: Clock3,    label: "Pendências", value: stats.pendingEvidences, sub: "Evidências aguardando",            color: stats.pendingEvidences > 0 ? "amber" as const : "green" as const },
            { icon: TrendingUp, label: "Certame",   value: stats.activeCertame?.year ?? "—", sub: stats.activeCertame ? "Certame ativo" : "Nenhum ativo", color: "slate" as const },
          ].map(({ icon: Icon, label, value, sub, color }, i) => {
            const palettes = {
              green: { iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-800", border: "border-emerald-100" },
              blue:  { iconBg: "bg-blue-100",    iconColor: "text-blue-600",    valueColor: "text-blue-800",    border: "border-blue-100"   },
              amber: { iconBg: "bg-amber-100",   iconColor: "text-amber-600",   valueColor: "text-amber-800",   border: "border-amber-100"  },
              slate: { iconBg: "bg-slate-100",   iconColor: "text-slate-500",   valueColor: "text-slate-700",   border: "border-slate-200"  },
            };
            const p = palettes[color];
            return (
              <div
                key={label}
                className={cn("rounded-2xl border bg-white p-5", p.border)}
                style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: `${80 + i * 50}ms` }}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4", p.iconBg)}>
                  <Icon className={cn("w-4 h-4", p.iconColor)} />
                </div>
                <div className={cn("text-2xl font-bold mb-0.5", p.valueColor)}>{value}</div>
                <div className="text-sm font-medium text-slate-600">{label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
              </div>
            );
          })}
        </div>

        {/* Evidências — card com barra de progresso */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6"
          style={{ animation: "fadeSlideUp 0.42s ease both", animationDelay: "280ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Evidências</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{totalEvidences} total</span>
          </div>

          <div className="p-6 grid sm:grid-cols-3 gap-4">
            {[
              { label: "Pendentes",  value: stats.pendingEvidences,  icon: AlertTriangle,  bg: "bg-amber-50  border-amber-200",  text: "text-amber-700",  bar: "bg-amber-400"  },
              { label: "Aprovadas",  value: stats.approvedEvidences, icon: CheckCircle2,   bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
              { label: "Rejeitadas", value: stats.rejectedEvidences, icon: XCircle,        bg: "bg-red-50    border-red-200",     text: "text-red-700",    bar: "bg-red-400"    },
            ].map((s) => {
              const pct = totalEvidences > 0 ? Math.round((s.value / totalEvidences) * 100) : 0;
              return (
                <div key={s.label} className={cn("rounded-2xl border p-5", s.bg)}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-xs font-bold uppercase tracking-wider", s.text)}>{s.label}</span>
                    <s.icon className={cn("w-4 h-4", s.text)} />
                  </div>
                  <div className={cn("text-3xl font-black mb-3", s.text)}>{s.value}</div>
                  <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", s.bar)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1.5 opacity-60 font-medium" style={{ color: "inherit" }}>
                    {pct}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribuição de Selos */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6"
          style={{ animation: "fadeSlideUp 0.44s ease both", animationDelay: "320ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Distribuição de Selos</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {[
              { selo: "A", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
              { selo: "B", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200"       },
              { selo: "C", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
              { selo: "Sem Selo", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
            ].map((s) => (
              <div key={s.selo} className={cn("rounded-2xl border p-5 text-center", s.bg)}>
                <div className={cn("text-sm font-bold uppercase tracking-wider mb-2", s.color)}>
                  {s.selo === "Sem Selo" ? "Sem Selo" : `Selo ${s.selo}`}
                </div>
                <div className={cn("text-3xl font-black", s.color)}>0</div>
                <div className="text-xs text-slate-400 mt-1">municípios</div>
              </div>
            ))}
          </div>
        </div>

        {/* Situação dos municípios */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.46s ease both", animationDelay: "360ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Situação dos Municípios</span>
            </div>
            <Link
              href="/admin/municipios"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors inline-flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center max-w-md">
              <p className="text-slate-600 font-semibold text-sm">Relatório em preparação</p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Conforme os municípios preencherem os checklists e enviarem evidências,
                os rankings, pontuações e selos aparecerão automaticamente aqui.
              </p>
            </div>
          </div>
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