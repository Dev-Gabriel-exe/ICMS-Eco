// src/app/(dashboard)/admin/municipios/MunicipiosTable.tsx
"use client";

import { createPortal } from "react-dom";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Hash, Users, CalendarDays, ExternalLink,
  Pencil, PowerOff, Trash2, AlertTriangle, CheckCircle2,
  Loader2, Power, Search, Filter, ChevronDown,
} from "lucide-react";
import { formatPopulation, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Municipality {
  id: string;
  name: string;
  ibgeCode: string | null;
  population: number;
  isActive: boolean;
  createdAt: Date;
  _count: { userMunicipalities: number };
}

// ─── Modal ────────────────────────────────────

function ConfirmModal({
  open, title, description, confirmLabel, confirmStyle, loading, onConfirm, onCancel,
}: {
  open: boolean; title: string; description: string; confirmLabel: string;
  confirmStyle: "danger" | "warning"; loading: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-7 flex flex-col gap-5"
        style={{ animation: "modalIn 0.2s ease both" }}>
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto",
          confirmStyle === "danger" ? "bg-red-50" : "bg-amber-50",
        )}>
          <AlertTriangle className={cn("w-7 h-7", confirmStyle === "danger" ? "text-red-500" : "text-amber-500")} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60",
              confirmStyle === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600",
            )}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Action Menu ──────────────────────────────

function ActionMenu({
  municipality, onToggle, onDelete,
}: {
  municipality: Municipality;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      const target = e.target as Node;
      // Verifica se clicou fora do botão E fora do portal
      if (ref.current && !ref.current.contains(target)) {
        // Checa se o clique foi dentro do dropdown no portal
        const portalEl = document.getElementById("action-menu-portal");
        if (portalEl && portalEl.contains(target)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (!open || !ref.current) return;
    function updateCoords() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open]);

  const dropdown = open && mounted ? createPortal(
    <div
      id="action-menu-portal"
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        width: 208,
        zIndex: 99999,
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
        animation: "actionDropIn 0.15s ease both",
      }}
    >
      {/* Abrir painel */}
      <Link
        href={`/municipio/${municipality.id}`}
        onMouseDown={() => setOpen(false)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          fontSize: 14, color: "#334155", textDecoration: "none",
          transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <ExternalLink style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />
        Abrir painel
      </Link>

      {/* Editar */}
      <Link
        href={`/admin/municipios/${municipality.id}`}
        onMouseDown={() => setOpen(false)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          fontSize: 14, color: "#334155", textDecoration: "none",
          transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <Pencil style={{ width: 16, height: 16, color: "#94a3b8", flexShrink: 0 }} />
        Editar dados
      </Link>

      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />

      {/* Ativar / Desativar */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(false); onToggle(); }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", fontSize: 14, border: "none", background: "transparent",
          cursor: "pointer", color: municipality.isActive ? "#92400e" : "#065f46",
          transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget.style.background = municipality.isActive ? "#fffbeb" : "#f0fdf4")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        {municipality.isActive
          ? <PowerOff style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0 }} />
          : <Power style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />}
        {municipality.isActive ? "Desativar município" : "Reativar município"}
      </button>

      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />

      {/* Excluir */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(false); onDelete(); }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", fontSize: 14, border: "none", background: "transparent",
          cursor: "pointer", color: "#dc2626", transition: "background 0.1s" }}
        onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <Trash2 style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} />
        Excluir permanentemente
      </button>

      <style>{`
        @keyframes actionDropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150",
            open
              ? "bg-slate-100 border-slate-300 text-slate-700"
              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
          )}
        >
          Ações
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", open && "rotate-180")} />
        </button>
      </div>
      {dropdown}
    </>
  );
}

// ─── Main Table ───────────────────────────────

export function MunicipiosTable({ initialData }: { initialData: Municipality[] }) {
  const [items, setItems] = useState<Municipality[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<{
    open: boolean; type: "deactivate" | "activate" | "delete"; id: string; name: string;
  }>({ open: false, type: "delete", id: "", name: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }

  async function handleConfirm() {
    setActionLoading(true);
    const { type, id, name } = modal;
    try {
      if (type === "delete") {
        const res = await fetch(`/api/municipalities/${id}/hard-delete`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Erro ao excluir.");
        setItems(prev => prev.filter(m => m.id !== id));
        showToast(`"${name}" excluído permanentemente.`, "success");
      } else {
        const isActive = type === "activate";
        const res = await fetch(`/api/municipalities/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Erro ao atualizar.");
        setItems(prev => prev.map(m => m.id === id ? { ...m, isActive } : m));
        showToast(isActive ? `"${name}" ativado com sucesso.` : `"${name}" desativado.`, "success");
      }
    } catch (err: any) {
      showToast(err.message ?? "Erro inesperado.", "error");
    }
    setActionLoading(false);
    setModal(m => ({ ...m, open: false }));
  }

  const filtered = items.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.ibgeCode ?? "").includes(search);
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "active" ? m.isActive :
      !m.isActive;
    return matchSearch && matchStatus;
  });

  const activeCount = items.filter(m => m.isActive).length;
  const inactiveCount = items.filter(m => !m.isActive).length;

  const modalConfig = {
    deactivate: {
      title: "Desativar município?",
      description: `"${modal.name}" ficará inativo e não aparecerá nos painéis. Você pode reativá-lo a qualquer momento.`,
      confirmLabel: "Desativar", confirmStyle: "warning" as const,
    },
    activate: {
      title: "Reativar município?",
      description: `"${modal.name}" voltará a aparecer nos painéis e ficará disponível para uso.`,
      confirmLabel: "Reativar", confirmStyle: "warning" as const,
    },
    delete: {
      title: "Excluir permanentemente?",
      description: `Esta ação é irreversível. "${modal.name}" e todos os seus dados serão removidos do banco de dados para sempre.`,
      confirmLabel: "Sim, excluir", confirmStyle: "danger" as const,
    },
  };

  const cfg = modalConfig[modal.type];

  return (
    <>
      {/* Toast */}
      <div className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3",
        "px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white whitespace-nowrap",
        "transition-all duration-300",
        toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none",
        toast.type === "success" ? "bg-emerald-600" : "bg-red-500",
      )}>
        {toast.type === "success"
          ? <CheckCircle2 className="w-4 h-4 shrink-0" />
          : <AlertTriangle className="w-4 h-4 shrink-0" />}
        {toast.message}
      </div>

      <ConfirmModal
        open={modal.open}
        title={cfg.title}
        description={cfg.description}
        confirmLabel={cfg.confirmLabel}
        confirmStyle={cfg.confirmStyle}
        loading={actionLoading}
        onConfirm={handleConfirm}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      {/* Stats rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-5"
        style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}>
        {[
          { label: "Total", value: items.length, color: "text-slate-700", bg: "bg-white border-slate-200" },
          { label: "Ativos", value: activeCount, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Inativos", value: inactiveCount, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl border px-5 py-4", s.bg)}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Barra de busca + filtro */}
      <div className="flex items-center gap-3 mb-4"
        style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou código IBGE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-800
                       placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 transition-all duration-200"
          />
        </div>
        <div className="flex rounded-xl border-2 border-slate-200 bg-white overflow-hidden shrink-0">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilterStatus(f)}
              className={cn(
                "px-3.5 py-2.5 text-xs font-semibold transition-colors duration-150",
                filterStatus === f
                  ? "bg-emerald-500 text-white"
                  : "text-slate-500 hover:bg-slate-50",
              )}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {/* Card tabela */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "140ms" }}>

        {/* Header do card */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            Lista de municípios
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {filtered.length} de {items.length} {items.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-medium text-sm">Nenhum município encontrado</p>
              {search && (
                <p className="text-slate-400 text-xs mt-1">
                  Sem resultados para "<strong>{search}</strong>"
                </p>
              )}
            </div>
            {search && (
              <button onClick={() => setSearch("")}
                className="text-xs text-emerald-600 font-semibold hover:underline">
                Limpar busca
              </button>
            )}
          </div>
        )}

        {/* Rows — cards em vez de tabela para evitar corte */}
        {filtered.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filtered.map((m, i) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors duration-150",
                  m.isActive ? "hover:bg-emerald-50/40" : "hover:bg-slate-50/60",
                  !m.isActive && "opacity-60",
                )}
                style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${i * 25}ms` }}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                  m.isActive ? "bg-emerald-100" : "bg-slate-100",
                )}>
                  <Building2 className={cn("w-5 h-5", m.isActive ? "text-emerald-600" : "text-slate-400")} />
                </div>

                {/* Nome + IBGE */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm truncate">{m.name}</span>
                    {m.ibgeCode && (
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                        {m.ibgeCode}
                      </span>
                    )}
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0",
                      m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", m.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                      {m.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {formatPopulation(m.population)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {m._count.userMunicipalities} funcionário{m._count.userMunicipalities !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Ações — dropdown menu */}
                <ActionMenu
                  municipality={m}
                  onToggle={() => setModal({
                    open: true,
                    type: m.isActive ? "deactivate" : "activate",
                    id: m.id,
                    name: m.name,
                  })}
                  onDelete={() => setModal({ open: true, type: "delete", id: m.id, name: m.name })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}