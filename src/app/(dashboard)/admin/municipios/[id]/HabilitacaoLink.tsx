 
"use client";
 
import Link from "next/link";
import { ShieldCheck, ChevronRight, CheckCircle, Clock, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
 
type HabStatus = "not_started" | "pending" | "approved" | "rejected" | "habilitado";
 
interface Props {
  municipioId: string;
  backTo?: string;
}

export function HabilitacaoLink({ municipioId, backTo = "/admin/municipios" }: Props) {
  const [status, setStatus] = useState<HabStatus>("not_started");
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    fetch(`/api/habilitacao/${municipioId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const docs         = data.data.docs ?? [];
        const isHabilitado = data.data.isHabilitado;
        if (isHabilitado) { setStatus("habilitado"); return; }
        const rejected = docs.some((d: { status: string }) => d.status === "rejected");
        const pending  = docs.some((d: { status: string }) => d.status === "pending");
        if (rejected) setStatus("rejected");
        else if (pending) setStatus("pending");
        else setStatus("not_started");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [municipioId]);
 
  const statusConfig = {
    not_started: { label: "Não iniciada",    icon: Circle,       cls: "text-slate-400" },
    pending:     { label: "Pendente",        icon: Clock,        cls: "text-amber-500" },
    rejected:    { label: "Com pendência",   icon: XCircle,      cls: "text-red-500"   },
    approved:    { label: "Aprovada",        icon: CheckCircle,  cls: "text-emerald-600" },
    habilitado:  { label: "Habilitado ✓",   icon: ShieldCheck,  cls: "text-emerald-600" },
  } as const;
 
  const cfg  = statusConfig[status] ?? statusConfig.not_started;
  const Icon = cfg.icon;
 
  return (
    <Link
      href={`/admin/municipios/${municipioId}/habilitacao?backTo=${encodeURIComponent(backTo)}`}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 rounded-xl border bg-white",
        "transition-all duration-150 hover:shadow-sm hover:border-emerald-300 group",
        status === "pending"  && "border-amber-200 bg-amber-50/30",
        status === "rejected" && "border-red-200 bg-red-50/30",
        status === "habilitado" && "border-emerald-200 bg-emerald-50/30",
        status === "not_started" && "border-slate-200",
      )}
    >
      <ShieldCheck size={16} className={cn("shrink-0", cfg.cls)} />
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">Habilitação Municipal</p>
        <p className="text-xs text-slate-500">
          {loading ? "Carregando..." : `Status: ${cfg.label}`}
        </p>
      </div>
      <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
    </Link>
  );
}
