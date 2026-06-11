// src/app/(dashboard)/admin/certames/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CalendarRange, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function NovoCertamePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    year: new Date().getFullYear() + 1,
    periodoInicio: "",
    periodoFim: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/certames", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao criar certame.");
      return;
    }

    router.push("/admin/certames");
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10">

      {/* Decorative background blobs */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[520px] h-[520px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[380px] h-[380px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-lg mx-auto">

        {/* Back link */}
        <Link
          href="/admin/certames"
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/70 hover:text-emerald-800 mb-8 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.35s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Voltar para certames
        </Link>

        {/* Page header */}
        <div
          className="mb-8"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}
            >
              <CalendarRange className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight tracking-tight">
                Novo certame
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                O certame anterior será automaticamente encerrado
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-5 p-4 rounded-2xl border flex items-start gap-3"
            style={{
              background: "rgba(254,226,226,0.6)",
              borderColor: "rgba(252,165,165,0.5)",
              animation: "fadeSlideUp 0.25s ease both",
              backdropFilter: "blur(8px)",
            }}
          >
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Main card */}
        <div
          className="rounded-3xl border p-7 shadow-sm"
          style={{
            background: "rgba(255,255,255,0.75)",
            borderColor: "rgba(167,243,208,0.6)",
            backdropFilter: "blur(12px)",
            animation: "fadeSlideUp 0.45s ease both",
            animationDelay: "100ms",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Ano */}
            <div style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "160ms" }}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Ano do certame
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  min={2026}
                  max={2040}
                  required
                  className="w-full px-4 py-3 pr-16 rounded-xl border text-slate-800 text-sm font-semibold
                             bg-white/80 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                             transition-all duration-200"
                  style={{ borderColor: "rgba(167,243,208,0.8)" }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                  ANO
                </span>
              </div>
            </div>

            {/* Divider com label */}
            <div
              className="flex items-center gap-3"
              style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "200ms" }}
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Período de apuração</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
            </div>

            {/* Datas lado a lado */}
            <div
              className="grid grid-cols-2 gap-4"
              style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "240ms" }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Início
                </label>
                <input
                  type="date"
                  value={form.periodoInicio}
                  onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                  required
                  className="w-full px-3.5 py-3 rounded-xl border text-slate-700 text-sm
                             bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/40
                             focus:border-emerald-400 transition-all duration-200"
                  style={{ borderColor: "rgba(167,243,208,0.8)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Fim
                </label>
                <input
                  type="date"
                  value={form.periodoFim}
                  onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
                  required
                  className="w-full px-3.5 py-3 rounded-xl border text-slate-700 text-sm
                             bg-white/80 focus:outline-none focus:ring-2 focus:ring-emerald-400/40
                             focus:border-emerald-400 transition-all duration-200"
                  style={{ borderColor: "rgba(167,243,208,0.8)" }}
                />
              </div>
            </div>

            {/* Info box */}
            <div
              className="p-4 rounded-2xl border flex items-start gap-3"
              style={{
                background: "linear-gradient(135deg, rgba(236,253,245,0.9) 0%, rgba(209,250,229,0.5) 100%)",
                borderColor: "rgba(110,231,183,0.5)",
                animation: "fadeSlideUp 0.4s ease both",
                animationDelay: "280ms",
              }}
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xs text-emerald-800 leading-relaxed">
                <span className="font-bold block mb-0.5">Atenção — art. 29 do Decreto</span>
                Para o certame <strong>2027</strong>, o período abrange os 2 anos civis anteriores + até
                o último dia da fase de postulação. A partir de <strong>2028</strong>, o período é
                1º jan – 31 dez do ano anterior.
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex gap-3 pt-1"
              style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "320ms" }}
            >
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-xl text-sm font-semibold text-white
                           transition-all duration-200 flex items-center justify-center gap-2
                           disabled:opacity-60 disabled:cursor-not-allowed
                           hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
                style={{
                  background: loading
                    ? "#6ee7b7"
                    : "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: "0 4px 16px -4px rgba(5,150,105,0.45)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Abrindo certame…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Abrir certame
                  </>
                )}
              </button>

              <Link
                href="/admin/certames"
                className="px-5 py-3 rounded-xl border text-sm font-medium text-slate-600
                           bg-white/80 hover:bg-white transition-all duration-200
                           hover:border-slate-300 hover:-translate-y-px"
                style={{ borderColor: "rgba(203,213,225,0.8)" }}
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        {/* Bottom note */}
        <p
          className="text-center text-xs text-slate-400 mt-5"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "380ms" }}
        >
          Decreto 24.288/2025 · SEMARH-PI
        </p>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}