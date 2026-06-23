// src/app/(dashboard)/admin/atividades/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Users, FileText, Building2, Activity, Trophy,
  AlertTriangle, CheckCircle2, Clock, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AtividadesFilters } from "./AtividadesFilters";

const ACTION_LABELS: Record<string, string> = {
  MUNICIPALITY_CREATED:    "Município criado",
  MUNICIPALITY_UPDATED:    "Município atualizado",
  USER_CREATED:            "Usuário criado",
  USER_UPDATED:            "Usuário atualizado",
  USER_LOGIN:              "Login",
  USER_LOGOUT:             "Logout",
  EVIDENCE_UPLOADED:       "Evidência enviada",
  EVIDENCE_APPROVED:       "Evidência aprovada",
  EVIDENCE_RETURNED:       "Evidência devolvida",
  EVIDENCE_REJECTED:       "Evidência rejeitada",
  EVIDENCE_DELETED:        "Evidência excluída",
  CHECKLIST_UPDATED:       "Checklist atualizado",
  CERTAME_CREATED:         "Certame criado",
  CERTAME_UPDATED:         "Certame atualizado",
  CERTAME_CLOSED:          "Certame encerrado",
  HABILITACAO_FILE_UPLOADED: "Habilitação enviada",
  HABILITACAO_DOC_APPROVED:  "Habilitação aprovada",
  HABILITACAO_DOC_REJECTED:  "Habilitação rejeitada",
};

const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  EVIDENCE_APPROVED:       { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  EVIDENCE_UPLOADED:       { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-400"    },
  EVIDENCE_REJECTED:       { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  EVIDENCE_RETURNED:       { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400"   },
  EVIDENCE_DELETED:        { bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  MUNICIPALITY_CREATED:    { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  CERTAME_CLOSED:          { bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
  USER_LOGIN:              { bg: "bg-sky-100",     text: "text-sky-700",     dot: "bg-sky-400"     },
  USER_LOGOUT:             { bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-400"   },
  HABILITACAO_DOC_APPROVED:{ bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  HABILITACAO_DOC_REJECTED:{ bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
};

function getActionStyle(action: string) {
  return ACTION_COLORS[action] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

// ─── Page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: { from?: string; to?: string };
}

export default async function AtividadesPage({ searchParams }: PageProps) {
  await requireAdmin();

  const { from, to } = await searchParams;

  // Constrói filtro de datas para os logs
  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to)   dateFilter.lte = new Date(`${to}T23:59:59`);
  const hasDateFilter = !!(from || to);

  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  const [logs, funcionarios, municipios] = await Promise.all([
    db.auditLog.findMany({
      where: hasDateFilter ? { createdAt: dateFilter } : undefined,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.user.findMany({
      where: { role: "employee" },
      include: {
        evidences: true,
        userMunicipalities: { include: { municipality: true } },
        auditLogs: true,
      },
    }),
    db.municipality.findMany({ include: { checklistItems: true } }),
  ]);

  const totalEvidencias = funcionarios.reduce((acc, f) => acc + f.evidences.length, 0);
  const municipiosAtendidos = new Set(
    funcionarios.flatMap(f => f.userMunicipalities.map(m => m.municipalityId))
  ).size;

  const funcionariosSemAtividade = funcionarios.filter(f => {
    const ultima = f.auditLogs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    return !ultima || ultima.createdAt < seteDiasAtras;
  });

  const ranking = [...funcionarios].sort((a, b) => b.evidences.length - a.evidences.length);

  const municipioMaisAtrasado = municipios
    .map(m => {
      const total     = m.checklistItems.length;
      const completos = m.checklistItems.filter(c => c.status === "complete").length;
      const percentual = total === 0 ? 0 : Math.round((completos / total) * 100);
      return { ...m, percentual, faltando: total - completos };
    })
    .sort((a, b) => a.percentual - b.percentual)[0];

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
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap"
          style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
            >
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Atividades da Equipe</h1>
              <p className="text-sm text-slate-500 mt-0.5">Monitoramento operacional em tempo real</p>
            </div>
          </div>

          {/* Filtros de data + botão exportar */}
          <AtividadesFilters from={from ?? ""} to={to ?? ""} total={logs.length} />
        </div>

        {/* Aviso de período filtrado */}
        {hasDateFilter && (
          <div className="mb-4 flex items-center gap-2 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            Exibindo {logs.length} atividade{logs.length !== 1 ? "s" : ""} no período selecionado.
            {" "}
            <a href="/admin/atividades" className="underline font-medium">Limpar filtro</a>
          </div>
        )}

        {/* KPI cards */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
        >
          {[
            { icon: Users,    label: "Funcionários",           value: funcionarios.length,  color: "green" as const },
            { icon: FileText, label: "Evidências Enviadas",    value: totalEvidencias,       color: "blue"  as const },
            { icon: Building2,label: "Municípios Atendidos",   value: municipiosAtendidos,   color: "slate" as const },
            { icon: Activity, label: "Atividades Registradas", value: logs.length,           color: funcionariosSemAtividade.length > 0 ? "amber" as const : "green" as const },
          ].map(({ icon: Icon, label, value, color }, i) => {
            const p = {
              green: { iconBg: "bg-emerald-100", iconColor: "text-emerald-600", valueColor: "text-emerald-800", border: "border-emerald-100" },
              blue:  { iconBg: "bg-blue-100",    iconColor: "text-blue-600",    valueColor: "text-blue-800",    border: "border-blue-100"   },
              amber: { iconBg: "bg-amber-100",   iconColor: "text-amber-600",   valueColor: "text-amber-800",   border: "border-amber-100"  },
              slate: { iconBg: "bg-slate-100",   iconColor: "text-slate-500",   valueColor: "text-slate-700",   border: "border-slate-200"  },
            }[color];
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
                <div className="text-xs font-medium text-slate-500 leading-snug">{label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Ranking de produtividade */}
          <div
            className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            style={{ animation: "fadeSlideUp 0.42s ease both", animationDelay: "280ms" }}
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Ranking de Produtividade</span>
            </div>

            {ranking.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Users className="w-8 h-8 text-slate-300" />
                <p className="text-slate-400 text-sm">Nenhum funcionário cadastrado.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {ranking.map((f, i) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors duration-150"
                    style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${300 + i * 35}ms` }}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-slate-100 text-slate-600" :
                      i === 2 ? "bg-orange-100 text-orange-600" :
                                "bg-slate-50 text-slate-400",
                    )}>
                      {i + 1}
                    </span>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
                    >
                      {initials(f.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{f.name}</p>
                      <p className="text-xs text-slate-400 truncate">{f.email}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <strong className="text-slate-700">{f.evidences.length}</strong> evidências
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <strong className="text-slate-700">{f.userMunicipalities.length}</strong> mun.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Sem atividade */}
            <div
              className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
              style={{ animation: "fadeSlideUp 0.42s ease both", animationDelay: "300ms" }}
            >
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Sem atividade</span>
                </div>
                <span className="text-xs text-slate-400">últimos 7 dias</span>
              </div>

              {funcionariosSemAtividade.length === 0 ? (
                <div className="px-5 py-6 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-700 font-medium">Todos ativos!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {funcionariosSemAtividade.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ background: "#94a3b8" }}
                      >
                        {initials(f.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400 truncate">{f.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Município mais atrasado */}
            {municipioMaisAtrasado && (
              <div
                className="rounded-3xl border border-red-200 bg-red-50 shadow-sm overflow-hidden"
                style={{ animation: "fadeSlideUp 0.44s ease both", animationDelay: "340ms" }}
              >
                <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-bold text-red-700 uppercase tracking-widest">Mais atrasado</span>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-bold text-slate-800 text-sm">{municipioMaisAtrasado.name}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Progresso</span>
                      <span className="text-xs font-bold text-red-600">{municipioMaisAtrasado.percentual}%</span>
                    </div>
                    <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-700"
                        style={{ width: `${municipioMaisAtrasado.percentual}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/70 rounded-xl p-2.5 border border-red-100">
                      <p className="text-slate-400">Pendências</p>
                      <p className="font-bold text-slate-700 mt-0.5">{municipioMaisAtrasado.faltando}</p>
                    </div>
                    <div className="bg-white/70 rounded-xl p-2.5 border border-red-100">
                      <p className="text-slate-400">População</p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {municipioMaisAtrasado.population.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Log de atividades */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.46s ease both", animationDelay: "360ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                {hasDateFilter ? "Atividades no Período" : "Últimas Atividades"}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{logs.length} registros</span>
          </div>

          {logs.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Activity className="w-8 h-8 text-slate-300" />
              <p className="text-slate-400 text-sm">
                {hasDateFilter
                  ? "Nenhuma atividade no período selecionado."
                  : "Nenhuma atividade registrada."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map((log, i) => {
                const style = getActionStyle(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors duration-150"
                    style={{ animation: "fadeSlideUp 0.3s ease both", animationDelay: `${380 + i * 20}ms` }}
                  >
                    <div className="mt-1.5 shrink-0">
                      <span className={cn("w-2 h-2 rounded-full block", style.dot)} />
                    </div>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
                    >
                      {initials(log.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{log.user.name}</span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold",
                          style.bg, style.text,
                        )}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{log.description}</p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-0.5">{log.user.email}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
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