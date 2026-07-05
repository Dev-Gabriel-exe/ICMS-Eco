// src/app/(dashboard)/admin/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Building2, Users, FileCheck, TrendingUp, Plus,
  MapPin, ExternalLink, CalendarRange, ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Painel Geral" };

async function getStats() {
  const [municipalities, users, activeCertame] = await Promise.all([
    db.municipality.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: true, role: { in: ["employee", "reviewer"] } } }),
    db.certame.findFirst({ where: { isActive: true, isClosed: false }, orderBy: { year: "desc" } }),
  ]);
  const pendingEvidences = await db.evidence.count({ where: { validationStatus: "pending" } });
  return { municipalities, users, activeCertame, pendingEvidences };
}

async function getMunicipalities() {
  return db.municipality.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, municipalities] = await Promise.all([getStats(), getMunicipalities()]);

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">

      {/* Blobs decorativos */}
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Painel Geral</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visão consolidada de todos os municípios — ICMS-Eco</p>
        </div>

        {/* Banner certame ativo */}
        {stats.activeCertame && (
          <div
            className="mb-7 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 flex items-center justify-between gap-4"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
              >
                <CalendarRange className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">
                  Certame {stats.activeCertame.year} em andamento
                </span>
                <span className="text-sm text-slate-500">
                  · {formatDate(stats.activeCertame.periodoInicio)} → {formatDate(stats.activeCertame.periodoFim)}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            </div>
            <Link
              href="/admin/certames"
              className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0"
            >
              Gerenciar <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Building2,
              label: "Municípios ativos",
              value: stats.municipalities,
              color: "green" as const,
              href: "/admin/municipios",
            },
            {
              icon: Users,
              label: "Funcionários",
              value: stats.users,
              color: "blue" as const,
              href: "/admin/usuarios",
            },
            {
              icon: FileCheck,
              label: "Evidências pendentes",
              value: stats.pendingEvidences,
              color: stats.pendingEvidences > 0 ? "amber" as const : "green" as const,
              href: "/pendencias",
            },
            {
              icon: TrendingUp,
              label: "Certame ativo",
              value: stats.activeCertame?.year ?? "—",
              color: "slate" as const,
              href: "/admin/certames",
            },
          ].map(({ icon, label, value, color, href }, i) => (
            <StatCard
              key={label}
              icon={icon}
              label={label}
              value={value}
              color={color}
              href={href}
              delay={80 + i * 50}
            />
          ))}
        </div>

        {/* Tabela de municípios */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "300ms" }}
        >
          {/* Header do card */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Lista de municípios
              </span>
            </div>
            <Link
              href="/admin/municipios/novo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                boxShadow: "0 3px 12px -3px rgba(5,150,105,0.5)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo município
            </Link>
          </div>

          {/* Empty state */}
          {municipalities.length === 0 && (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">Nenhum município cadastrado ainda.</p>
            </div>
          )}

          {/* Rows */}
          {municipalities.length > 0 && (
            <div className="divide-y divide-slate-100">
              {municipalities.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-emerald-50/40 transition-colors duration-150"
                  style={{
                    animation: "fadeSlideUp 0.35s ease both",
                    animationDelay: `${340 + i * 30}ms`,
                  }}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>

                  {/* Nome + IBGE */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                      {m.ibgeCode && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {m.ibgeCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {m.population.toLocaleString("pt-BR")} hab.
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                          m.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            m.isActive ? "bg-emerald-500" : "bg-slate-400",
                          )}
                        />
                        {m.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  {/* Ação */}
                  <Link
                    href={`/municipio/${m.id}?backTo=/admin`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-150 hover:-translate-y-px shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver painel
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Footer com link para lista completa */}
          {municipalities.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Exibindo {municipalities.length} município{municipalities.length !== 1 ? "s" : ""} ativo{municipalities.length !== 1 ? "s" : ""}
              </span>
              <Link
                href="/admin/municipios"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 hover:underline transition-colors inline-flex items-center gap-1"
              >
                Ver todos <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
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

// ─── StatCard ─────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: "green" | "blue" | "amber" | "slate";
  href: string;
  delay?: number;
}) {
  const palettes = {
    green: {
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-800",
      border: "border-emerald-100",
      hover: "hover:border-emerald-200",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-blue-800",
      border: "border-blue-100",
      hover: "hover:border-blue-200",
    },
    amber: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-800",
      border: "border-amber-100",
      hover: "hover:border-amber-200",
    },
    slate: {
      iconBg: "bg-slate-100",
      iconColor: "text-slate-500",
      valueColor: "text-slate-700",
      border: "border-slate-200",
      hover: "hover:border-slate-300",
    },
  };

  const p = palettes[color];

  return (
    <Link href={href}>
      <div
        className={cn(
          "rounded-2xl border bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer",
          p.border,
          p.hover,
        )}
        style={{
          animation: "fadeSlideUp 0.4s ease both",
          animationDelay: `${delay}ms`,
        }}
      >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4 shrink-0", p.iconBg)}>
          <Icon className={cn("w-4 h-4", p.iconColor)} />
        </div>
        <div className={cn("text-2xl font-bold mb-0.5", p.valueColor)}>{value}</div>
        <div className="text-xs text-slate-500 font-medium leading-snug">{label}</div>
      </div>
    </Link>
  );
}
