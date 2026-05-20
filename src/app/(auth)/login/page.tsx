// src/app/(auth)/login/page.tsx
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-surface-300 mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoComplete="email"
          className="w-full px-3 py-2.5 rounded-lg bg-surface-700 border border-surface-600
                     text-white placeholder:text-surface-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                     transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-surface-300 mb-1.5">
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
            className="w-full px-3 py-2.5 pr-10 rounded-lg bg-surface-700 border border-surface-600
                       text-white placeholder:text-surface-500 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                       transition-colors"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700
                   text-white text-sm font-semibold transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 mt-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #22c55e 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-900/50">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white text-xl font-semibold">ICMS-ECO</h1>
          <p className="text-surface-400 text-sm mt-1">
            Gestão do Selo Ambiental — ICMS-ECO
          </p>
        </div>

        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 shadow-xl">
          <h2 className="text-white font-semibold text-base mb-5">Acesse sua conta</h2>
          <LoginForm />
        </div>

        <p className="text-center text-surface-600 text-xs mt-6">
          Precisa de acesso? Fale com o administrador.
        </p>
      </div>
    </div>
  );
}
