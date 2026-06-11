// src/app/(auth)/login/LoginPageClient.tsx
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2.5 animate-scale-in">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-surface-400 uppercase tracking-widest">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10
                     text-white placeholder:text-surface-600 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40
                     hover:border-white/20 transition-all duration-200"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-surface-400 uppercase tracking-widest">
          Senha
        </label>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10
                       text-white placeholder:text-surface-600 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40
                       hover:border-white/20 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-600 hover:text-surface-300 transition-colors p-0.5"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500
                   text-white text-sm font-semibold transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 mt-2
                   shadow-lg shadow-brand-900/50 hover:shadow-brand-800/60
                   hover:-translate-y-px active:translate-y-0 active:scale-[0.99]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar no sistema"
        )}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#060f0a] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Grid pattern background */}
      <div
        className="fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #4ade80 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Gradient orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 70%)" }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #4ade80 0%, transparent 70%)" }} />

      {/* Floating leaves */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[
          { top: "15%", left: "8%", delay: "0s", size: "24px", opacity: 0.12 },
          { top: "72%", left: "6%", delay: "1.5s", size: "18px", opacity: 0.08 },
          { top: "30%", right: "7%", delay: "0.8s", size: "20px", opacity: 0.10 },
          { top: "80%", right: "10%", delay: "2s", size: "16px", opacity: 0.07 },
          { top: "50%", left: "3%", delay: "3s", size: "14px", opacity: 0.06 },
        ].map((leaf, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              top: leaf.top,
              left: (leaf as { left?: string }).left,
              right: (leaf as { right?: string }).right,
              animationDelay: leaf.delay,
              animationDuration: `${5 + i}s`,
            }}
          >
            <Leaf
              style={{ width: leaf.size, height: leaf.size, color: `rgba(74, 222, 128, ${leaf.opacity})` }}
            />
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-sm animate-fade-up">

        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 animate-pulse-glow relative"
            style={{ background: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)" }}>
            <Leaf className="w-8 h-8 text-white" />
            <div className="absolute inset-0 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)", opacity: 0.3, filter: "blur(8px)", transform: "scale(1.1)" }} />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">ICMS-ECO</h1>
          <p className="text-surface-500 text-sm mt-1.5">
            Gestão do Selo Ambiental — Piauí
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 p-7 animate-fade-up delay-100"
          style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <h2 className="text-white font-semibold text-base">Acesse sua conta</h2>
          </div>
          <LoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-surface-700 text-xs mt-6 animate-fade-up delay-200">
          Precisa de acesso? Fale com o administrador.
        </p>

        {/* Decreto badge */}
        <div className="text-center mt-3 animate-fade-up delay-300">
          <span className="text-[10px] text-surface-700 bg-white/4 border border-white/6 px-3 py-1 rounded-full">
            Decreto 24.288/2025 · SEMARH-PI
          </span>
        </div>
      </div>
    </div>
  );
}