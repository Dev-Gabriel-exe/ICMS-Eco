// src/app/(dashboard)/admin/usuarios/UsuariosTable.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Power,
  PowerOff,
  Search,
  Trash2,
  User as UserIcon,
  Users,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee" | "reviewer";
  isActive: boolean;
  createdAt: Date;
  userMunicipalities: { municipality: { name: string } }[];
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmStyle,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmStyle: "danger" | "warning";
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-7 flex flex-col gap-5" style={{ animation: "modalIn 0.2s ease both" }}>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto", confirmStyle === "danger" ? "bg-red-50" : "bg-amber-50") }>
          <AlertTriangle className={cn("w-7 h-7", confirmStyle === "danger" ? "text-red-500" : "text-amber-500")} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60",
              confirmStyle === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600",
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`\n        @keyframes modalIn {\n          from { opacity: 0; transform: scale(0.93) translateY(10px); }\n          to   { opacity: 1; transform: scale(1) translateY(0); }\n        }\n      `}</style>
    </div>,
    document.body,
  );
}

function ActionMenu({
  user,
  onToggle,
  onDelete,
}: {
  user: UserItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        const portal = document.getElementById("user-action-portal");
        if (portal && portal.contains(target)) return;
        setOpen(false);
      }
    }

    function updatePosition() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    }

    updatePosition();
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  const dropdown = open && mounted ? createPortal(
    <div
      id="user-action-portal"
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
      <Link
        href={`/admin/usuarios/${user.id}`}
        onClick={() => setOpen(false)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", fontSize: 14, color: "#334155", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Pencil style={{ width: 16, height: 16, color: "#94a3b8", flexShrink: 0 }} />
        Editar dados
      </Link>
      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(false);
          onToggle();
        }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", fontSize: 14, border: "none", background: "transparent", cursor: "pointer", color: user.isActive ? "#92400e" : "#065f46" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = user.isActive ? "#fffbeb" : "#f0fdf4")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        {user.isActive ? <PowerOff style={{ width: 16, height: 16, color: "#f59e0b", flexShrink: 0 }} /> : <Power style={{ width: 16, height: 16, color: "#10b981", flexShrink: 0 }} />}
        {user.isActive ? "Inativar usu\u00e1rio" : "Ativar usu\u00e1rio"}
      </button>
      <div style={{ height: 1, background: "#f1f5f9", margin: "0 12px" }} />
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(false);
          onDelete();
        }}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", fontSize: 14, border: "none", background: "transparent", cursor: "pointer", color: "#dc2626" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Trash2 style={{ width: 16, height: 16, color: "#f87171", flexShrink: 0 }} />
        Excluir
      </button>
      <style>{`\n        @keyframes actionDropIn {\n          from { opacity: 0; transform: translateY(-6px); }\n          to   { opacity: 1; transform: translateY(0); }\n        }\n      `}</style>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
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

export function UsuariosTable({ initialData }: { initialData: UserItem[] }) {
  const [items, setItems] = useState<UserItem[]>(initialData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [modal, setModal] = useState<{ open: boolean; type: "deactivate" | "activate" | "delete"; id: string; name: string }>({
    open: false,
    type: "delete",
    id: "",
    name: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" as "success" | "error", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string, type: "success" | "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }

  async function handleConfirm() {
    setActionLoading(true);
    const { type, id, name } = modal;

    try {
      if (type === "delete") {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Erro ao excluir.");
        setItems((prev) => prev.filter((u) => u.id !== id));
        showToast(`"${name}" excluido permanentemente.`, "success");
      } else {
        const isActive = type === "activate";
        const res = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error ?? "Erro ao atualizar.");
        setItems((prev) => prev.map((u) => (u.id === id ? { ...u, isActive } : u)));
        showToast(isActive ? `"${name}" reativado.` : `"${name}" desativado.`, "success");
      }
    } catch (err: any) {
      showToast(err?.message ?? "Erro inesperado.", "error");
    }

    setActionLoading(false);
    setModal((m) => ({ ...m, open: false }));
  }

  const filteredItems = items.filter((u) => {
    const term = search.trim().toLowerCase();
    const matchSearch = term.length === 0 || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
    const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? u.isActive : !u.isActive;
    return matchSearch && matchStatus;
  });

  const modalConfig = {
    deactivate: {
      title: "Desativar funcion\u00e1rio?",
      description: `"${modal.name}" nao conseguira mais acessar o sistema. Voce pode reativa-lo a qualquer momento.`,
      confirmLabel: "Desativar",
      confirmStyle: "warning" as const,
    },
    activate: {
      title: "Reativar funcion\u00e1rio?",
      description: `"${modal.name}" voltara a ter acesso ao sistema.`,
      confirmLabel: "Reativar",
      confirmStyle: "warning" as const,
    },
    delete: {
      title: "Excluir permanentemente?",
      description: `Esta a\u00e7ao e irreversivel. "${modal.name}" e todos os seus dados serao removidos para sempre.`,
      confirmLabel: "Sim, excluir",
      confirmStyle: "danger" as const,
    },
  };

  const cfg = modalConfig[modal.type];

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3",
          "px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white whitespace-nowrap",
          "transition-all duration-300",
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none",
          toast.type === "success" ? "bg-emerald-600" : "bg-red-500",
        )}
      >
        {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
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
        onCancel={() => setModal((m) => ({ ...m, open: false }))}
      />

      <div className="flex items-center gap-3 mb-4" style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 transition-all duration-200"
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
                filterStatus === f ? "bg-emerald-500 text-white" : "text-slate-500 hover:bg-slate-50",
              )}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden" style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "140ms" }}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            Equipe cadastrada
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {filteredItems.length} de {items.length} {items.length === 1 ? "registro" : "registros"}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-slate-500 font-medium text-sm">Nenhum funcionario encontrado</p>
              {search.trim() && (
                <p className="text-slate-400 text-xs mt-1">
                  Sem resultados para "<strong>{search.trim()}</strong>"
                </p>
              )}
            </div>
            {search.trim() && (
              <button type="button" onClick={() => setSearch("")} className="text-xs text-emerald-600 font-semibold hover:underline">
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((u, i) => {
              const initials = u.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
              const munis = u.userMunicipalities;

              return (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 transition-colors duration-150",
                    u.isActive ? "hover:bg-emerald-50/40" : "hover:bg-slate-50/60",
                    !u.isActive && "opacity-60",
                  )}
                  style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${i * 30}ms` }}
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{ background: u.isActive ? "linear-gradient(135deg, #059669, #34d399)" : "#cbd5e1" }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{u.name}</span>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0",
                        u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500",
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                        {u.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <UserIcon className="w-3 h-3" />
                        {u.role === "reviewer" ? "Revisor" : "Funcionario"}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3 h-3" /> {u.email}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <CalendarDays className="w-3 h-3" /> {formatDate(u.createdAt)}
                      </span>
                    </div>

                    {munis.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        {munis.slice(0, 2).map(({ municipality }) => (
                          <span
                            key={municipality.name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                          >
                            <MapPin className="w-2.5 h-2.5" />
                            {municipality.name}
                          </span>
                        ))}
                        {munis.length > 2 && <span className="text-[11px] text-slate-400 font-medium">+{munis.length - 2}</span>}
                      </div>
                    )}
                  </div>

                  <ActionMenu
                    user={u}
                    onToggle={() =>
                      setModal({
                        open: true,
                        type: u.isActive ? "deactivate" : "activate",
                        id: u.id,
                        name: u.name,
                      })
                    }
                    onDelete={() => setModal({ open: true, type: "delete", id: u.id, name: u.name })}
                  />
                </div>
              );
            })}
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
