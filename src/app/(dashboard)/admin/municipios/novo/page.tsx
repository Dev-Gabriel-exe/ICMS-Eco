// src/app/(dashboard)/admin/municipios/novo/page.tsx
"use client";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NovoMunicipioPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", population: "", ibgeCode: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/municipalities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        population: Number(form.population),
        ibgeCode: form.ibgeCode || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao criar município.");
      return;
    }

    router.push("/admin/municipios");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href="/admin/municipios"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <h1 className="text-xl font-semibold text-surface-900 mb-1">Novo município</h1>
      <p className="text-sm text-surface-500 mb-6">
        Adicione um município ao sistema para começar a documentação.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome do município</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Teresina"
                required
                className="input"
              />
            </div>

            <div>
              <label className="label">Código IBGE</label>
              <input
                type="text"
                value={form.ibgeCode}
                onChange={(e) => setForm({ ...form, ibgeCode: e.target.value })}
                placeholder="Ex: 2211001"
                maxLength={7}
                className="input"
              />
              <p className="text-xs text-surface-400 mt-1">Opcional — 7 dígitos</p>
            </div>

            <div>
              <label className="label">População estimada</label>
              <input
                type="number"
                value={form.population}
                onChange={(e) => setForm({ ...form, population: e.target.value })}
                placeholder="Ex: 15000"
                required
                min={1}
                className="input"
              />
              <p className="text-xs text-surface-400 mt-1">
                Usado para calcular as faixas do critério C.5 (plantio de mudas)
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Criando..." : "Criar município"}
              </button>
              <Link href="/admin/municipios" className="btn btn-secondary">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
