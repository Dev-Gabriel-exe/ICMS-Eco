// src/components/habilitacao/HabilitacaoBadge.tsx
import { ShieldCheck, ShieldX, Clock, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type HabGlobalStatus = "not_started" | "pending" | "rejected" | "habilitado";

interface HabilitacaoBadgeProps {
  status: HabGlobalStatus;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const CONFIG = {
  not_started: {
    label:    "Hab. não iniciada",
    icon:     Circle,
    classes:  "bg-slate-100 text-slate-500 border-slate-200",
  },
  pending: {
    label:    "Hab. pendente",
    icon:     Clock,
    classes:  "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label:    "Hab. com pendência",
    icon:     ShieldX,
    classes:  "bg-red-50 text-red-700 border-red-200",
  },
  habilitado: {
    label:    "Habilitado",
    icon:     ShieldCheck,
    classes:  "bg-emerald-600 text-white border-emerald-600",
  },
};

export function HabilitacaoBadge({
  status,
  size = "md",
  showIcon = true,
}: HabilitacaoBadgeProps) {
  const cfg   = CONFIG[status] ?? CONFIG.not_started;
  const Icon  = cfg.icon;
  const isSm  = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-full font-semibold",
        cfg.classes,
        isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {showIcon && <Icon className={isSm ? "w-2.5 h-2.5" : "w-3 h-3"} />}
      {cfg.label}
    </span>
  );
}

// ── Versão com alerta para usar em dashboards ──────────────────────────────

interface HabAlertBannerProps {
  status: HabGlobalStatus;
  municipioId: string;
  isAdmin?: boolean;
}

export function HabAlertBanner({ status, municipioId, isAdmin = false }: HabAlertBannerProps) {
  if (status === "habilitado") return null;

  const href = isAdmin
    ? `/admin/municipios/${municipioId}/habilitacao`
    : `/municipio/${municipioId}/habilitacao`;

  const messages = {
    not_started: {
      text:    "Habilitação não iniciada. Envie os documentos obrigatórios para participar do certame.",
      classes: "bg-slate-50 border-slate-200 text-slate-700",
      icon:    <Circle className="w-4 h-4 text-slate-400 shrink-0" />,
    },
    pending: {
      text:    "Habilitação aguardando análise. Os documentos enviados serão verificados pela SEMARH.",
      classes: "bg-amber-50 border-amber-200 text-amber-800",
      icon:    <Clock className="w-4 h-4 text-amber-500 shrink-0" />,
    },
    rejected: {
      text:    "Um ou mais documentos foram reprovados. Corrija e reenvie para habilitar o município.",
      classes: "bg-red-50 border-red-200 text-red-800",
      icon:    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
    },
  };

  const cfg = messages[status as keyof typeof messages];
  if (!cfg) return null;

  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium",
        "transition-all duration-150 hover:shadow-sm hover:brightness-95",
        cfg.classes
      )}
    >
      {cfg.icon}
      <span className="flex-1">{cfg.text}</span>
      <span className="text-xs underline underline-offset-2 shrink-0">Ver habilitação →</span>
    </a>
  );
}