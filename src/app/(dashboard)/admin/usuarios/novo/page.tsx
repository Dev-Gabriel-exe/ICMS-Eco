// src/app/(dashboard)/admin/usuarios/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, UserPlus, Mail,
  CheckCircle2, AlertTriangle, Sparkles, Shield,
} from "lucide-react";

type RoleOption = "employee" | "reviewer";

const ROLE_OPTIONS: { value: RoleOption; label: string; desc: string }[] = [
  {
    value: "employee",
    label: "Funcionário",
    desc: "Envia evidências e preenche o checklist do município",
  },
  {
    value: "reviewer",
    label: "Revisor",
    desc: "Aprova e rejeita evidências, sem acesso administrativo",
  },
];

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: "", email: "", role: "employee" as RoleOption });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res  = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao criar usuário.");
      return;
    }

    setSuccess(`Usuário criado! Credenciais enviadas para ${form.email}.`);
    setTimeout(() => router.push("/admin/usuarios"), 3000);
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)", filter: "blur(48px)" }} />
      <div className="pointer-events-none fixed bottom-[-60px] left-[-60px] w-[320px] h-[320px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative max-w-lg mx-auto">
        <Link href="/admin/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/70 hover:text-emerald-800 mb-8 group transition-colors"
          style={{ animation: "fadeSlideUp 0.35s ease both" }}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Funcionários
        </Link>

        <div className="flex items-center gap-3 mb-8"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Novo usuário</h1>
            <p className="text-sm text-slate-500 mt-0.5">Senha provisória gerada e enviada por e-mail</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3"
            style={{ background: "rgba(254,226,226,0.6)", borderColor: "rgba(252,165,165,0.5)" }}>
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-2xl border flex items-start gap-3"
            style={{ background: "rgba(236,253,245,0.9)", borderColor: "rgba(110,231,183,0.5)" }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-emerald-800 text-sm font-semibold mb-0.5">Criado com sucesso!</p>
              <p className="text-emerald-700 text-sm">{success}</p>
              <p className="text-emerald-500 text-xs mt-1">Redirecionando…</p>
            </div>
          </div>
        )}

        <div className="rounded-3xl border overflow-hidden shadow-sm"
          style={{ background: "rgba(255,255,255,0.8)", borderColor: "rgba(167,243,208,0.6)", backdropFilter: "blur(12px)", animation: "fadeSlideUp 0.45s ease both", animationDelay: "100ms" }}>

          <div className="px-6 py-4 border-b flex items-center gap-2.5"
            style={{ borderColor: "rgba(167,243,208,0.5)", background: "rgba(236,253,245,0.6)" }}>
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Dados do usuário</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Nome completo</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: João Silva" required
                className="w-full px-4 py-3 rounded-xl border text-slate-800 text-sm bg-white/80 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                style={{ borderColor: "rgba(167,243,208,0.8)" }} />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="usuario@ambiental.com.br" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-slate-800 text-sm bg-white/80 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                  style={{ borderColor: "rgba(167,243,208,0.8)" }} />
              </div>
            </div>

            {/* Perfil de acesso */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Perfil de acesso
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm({ ...form, role: opt.value })}
                    className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border text-left transition-all ${
                      form.role === opt.value
                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-300/50"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30"
                    }`}>
                    <span className={`text-sm font-semibold ${form.role === opt.value ? "text-emerald-800" : "text-slate-700"}`}>
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 rounded-2xl border flex items-start gap-3"
              style={{ background: "linear-gradient(135deg, rgba(236,253,245,0.9) 0%, rgba(209,250,229,0.5) 100%)", borderColor: "rgba(110,231,183,0.5)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(16,185,129,0.15)" }}>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Uma <strong>senha provisória</strong> será gerada e enviada ao e-mail informado.
                O usuário poderá alterá-la no primeiro acesso.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading || !!success}
                className="flex-1 py-3 px-5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 hover:-translate-y-px active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", boxShadow: "0 4px 16px -4px rgba(5,150,105,0.45)" }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Criando…</> : <><UserPlus className="w-4 h-4" />Criar usuário</>}
              </button>
              <Link href="/admin/usuarios"
                className="px-5 py-3 rounded-xl border text-sm font-medium text-slate-600 bg-white/80 hover:bg-white transition-all hover:border-slate-300 hover:-translate-y-px"
                style={{ borderColor: "rgba(203,213,225,0.8)" }}>
                Cancelar
              </Link>
            </div>
          </form>
        </div>
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