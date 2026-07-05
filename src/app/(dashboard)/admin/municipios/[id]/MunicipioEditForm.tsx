// src/app/(dashboard)/admin/municipios/[id]/MunicipioEditForm.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Loader2, X, MapPin, Users, CheckCircle2, AlertTriangle, Trash2, UserPlus } from "lucide-react";
import { HabilitacaoLink } from "./HabilitacaoLink";


interface User {
  id: string;
  name: string;
  email: string;
}

interface Municipality {
  id: string;
  name: string;
  population: number;
  ibgeCode: string | null;
  isActive: boolean;
}

export default function MunicipioEditForm({
  municipality,
  linkedUsers,
  allUsers,
}: {
  municipality: Municipality;
  linkedUsers: User[];
  allUsers: User[];
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: municipality.name,
    population: String(municipality.population),
    ibgeCode: municipality.ibgeCode ?? "",
    isActive: municipality.isActive,
  });

  const [linked, setLinked] = useState<User[]>(linkedUsers);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const unlinked = allUsers.filter((u) => !linked.find((l) => l.id === u.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/municipalities/${municipality.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          population: Number(form.population),
          ibgeCode: form.ibgeCode || null,
          isActive: form.isActive,
          userIds: linked.map((u) => u.id),
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/admin/municipios"), 1500);
    } catch {
      setLoading(false);
      setError("Erro ao salvar município.");
    }
  }

  async function handleDelete() {
    const confirmed = confirm("Tem certeza que deseja excluir este município?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/municipalities/${municipality.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Erro ao excluir município.");
        setDeleting(false);
        return;
      }

      router.push("/admin/municipios");
    } catch {
      setDeleting(false);
      setError("Erro ao excluir município.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="pointer-events-none fixed top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)", filter: "blur(48px)" }} />
      <div className="pointer-events-none fixed bottom-[-60px] left-[-60px] w-[320px] h-[320px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative max-w-2xl mx-auto">

        {/* Back */}
        <Link
          href="/admin/municipios"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/70 hover:text-emerald-800 mb-8 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.35s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Municípios
        </Link>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8" style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">{municipality.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Editar dados e vínculos de usuários</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3"
            style={{ background: "rgba(254,226,226,0.6)", borderColor: "rgba(252,165,165,0.5)", animation: "fadeSlideUp 0.25s ease both" }}>
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3"
            style={{ background: "rgba(236,253,245,0.8)", borderColor: "rgba(110,231,183,0.5)", animation: "fadeSlideUp 0.25s ease both" }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-emerald-800 text-sm font-medium">Salvo com sucesso! Redirecionando…</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "80ms" }}>
            <HabilitacaoLink municipioId={municipality.id} backTo={`/admin/municipios/${municipality.id}`} />
          </div>

          {/* Card — Dados */}
          <div className="rounded-3xl border overflow-hidden shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(167,243,208,0.6)", backdropFilter: "blur(12px)", animation: "fadeSlideUp 0.45s ease both", animationDelay: "100ms" }}>

            <div className="px-6 py-4 border-b flex items-center gap-2.5"
              style={{ borderColor: "rgba(167,243,208,0.5)", background: "rgba(236,253,245,0.6)" }}>
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Dados do município</span>
            </div>

            <div className="p-6 space-y-5">
              {/* Nome */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border text-slate-800 text-sm bg-white/80
                             focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                             transition-all duration-200 placeholder:text-slate-400"
                  style={{ borderColor: "rgba(167,243,208,0.8)" }}
                />
              </div>

              {/* IBGE + População */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Código IBGE</label>
                  <input
                    type="text"
                    value={form.ibgeCode}
                    onChange={(e) => setForm({ ...form, ibgeCode: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border text-slate-800 text-sm bg-white/80
                               focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                               transition-all duration-200 placeholder:text-slate-400"
                    style={{ borderColor: "rgba(167,243,208,0.8)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">População</label>
                  <input
                    type="number"
                    value={form.population}
                    onChange={(e) => setForm({ ...form, population: e.target.value })}
                    required
                    min={1}
                    className="w-full px-4 py-3 rounded-xl border text-slate-800 text-sm bg-white/80
                               focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                               transition-all duration-200"
                    style={{ borderColor: "rgba(167,243,208,0.8)" }}
                  />
                </div>
              </div>

              {/* Toggle ativo */}
              <div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="relative w-11 h-6 rounded-full transition-all duration-300"
                    style={{ background: form.isActive ? "linear-gradient(135deg, #059669, #10b981)" : "#cbd5e1" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300"
                      style={{ left: form.isActive ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                    {form.isActive ? "Município ativo" : "Município inativo"}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: form.isActive ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.15)",
                      color: form.isActive ? "#059669" : "#94a3b8",
                    }}
                  >
                    {form.isActive ? "Ativo" : "Inativo"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Card — Usuários */}
          <div className="rounded-3xl border overflow-hidden shadow-sm"
            style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(167,243,208,0.6)", backdropFilter: "blur(12px)", animation: "fadeSlideUp 0.45s ease both", animationDelay: "160ms" }}>

            <div className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "rgba(167,243,208,0.5)", background: "rgba(236,253,245,0.6)" }}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Funcionários vinculados</span>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(16,185,129,0.12)", color: "#059669" }}
              >
                {linked.length}
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Tags de vinculados */}
              {linked.length === 0 ? (
                <div className="flex flex-col items-center py-6 gap-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(167,243,208,0.3)" }}>
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-sm text-slate-400">Nenhum funcionário vinculado.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {linked.map((u) => (
                    <div
                      key={u.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#065f46", border: "1px solid rgba(110,231,183,0.4)" }}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #059669, #34d399)" }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                      <button
                        type="button"
                        onClick={() => setLinked(linked.filter((l) => l.id !== u.id))}
                        className="ml-0.5 text-emerald-500 hover:text-red-500 transition-colors duration-150"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Select adicionar */}
              {unlinked.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Adicionar funcionário
                  </label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border text-slate-700 text-sm bg-white/80
                               focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                               transition-all duration-200 cursor-pointer"
                    style={{ borderColor: "rgba(167,243,208,0.8)" }}
                    onChange={(e) => {
                      const user = allUsers.find((u) => u.id === e.target.value);
                      if (user) setLinked([...linked, user]);
                      e.target.value = "";
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Selecione um funcionário…</option>
                    {unlinked.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-between pt-1"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "220ms" }}
          >
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600
                         border transition-all duration-200 hover:-translate-y-px active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "rgba(252,165,165,0.5)", background: "rgba(254,226,226,0.4)" }}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? "Excluindo…" : "Excluir município"}
            </button>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                           transition-all duration-200 hover:-translate-y-px active:scale-[0.98]
                           disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: "0 4px 14px -4px rgba(5,150,105,0.45)",
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Salvando…" : (
                  <><CheckCircle2 className="w-4 h-4" /> Salvar alterações</>
                )}
              </button>

              <Link
                href="/admin/municipios"
                className="px-5 py-2.5 rounded-xl border text-sm font-medium text-slate-600
                           bg-white/80 hover:bg-white transition-all duration-200
                           hover:border-slate-300 hover:-translate-y-px"
                style={{ borderColor: "rgba(203,213,225,0.8)" }}
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
  
}
