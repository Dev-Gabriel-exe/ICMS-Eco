// src/app/(dashboard)/admin/certames/novo/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

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
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href="/admin/certames"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-xl font-semibold text-surface-900 mb-1">Novo certame</h1>
      <p className="text-sm text-surface-500 mb-6">
        Abre um novo ano de avaliação. O certame anterior será desativado.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ano do certame</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                min={2026}
                max={2040}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Início do período de apuração</label>
              <input
                type="date"
                value={form.periodoInicio}
                onChange={(e) => setForm({ ...form, periodoInicio: e.target.value })}
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Fim do período de apuração</label>
              <input
                type="date"
                value={form.periodoFim}
                onChange={(e) => setForm({ ...form, periodoFim: e.target.value })}
                required
                className="input"
              />
            </div>

            <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-sm text-brand-800">
              <strong>Atenção (art. 29):</strong> Para o certame 2027, o período de apuração
              abrange os 2 anos civis anteriores + até o último dia da fase de postulação.
              Para 2028+, o período é 1° jan – 31 dez do ano anterior.
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Abrindo..." : "Abrir certame"}
              </button>
              <Link href="/admin/certames" className="btn btn-secondary">Cancelar</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
