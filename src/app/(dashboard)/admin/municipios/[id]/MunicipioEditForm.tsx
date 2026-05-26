// src/app/(dashboard)/admin/municipios/[id]/MunicipioEditForm.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowLeft, Loader2, X } from "lucide-react";

import { formatPopulation } from "@/lib/utils";
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const unlinked = allUsers.filter((u) => !linked.find((l) => l.id === u.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/municipalities/${municipality.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        population: Number(form.population),
        ibgeCode: form.ibgeCode || null,
        isActive: form.isActive,
        municipalityIds: undefined,
      }),
    });

    // Atualiza vínculos de usuários
    await fetch(`/api/users/${linked.map((u) => u.id).join(",")}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ municipalityId: municipality.id, userIds: linked.map((u) => u.id) }),
    });

    // Salva vínculos via API dedicada
    for (const u of allUsers) {
      const isLinked = linked.some((l) => l.id === u.id);
      await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityIds: isLinked
            ? [...new Set([...(u as User & { municipalities?: string[] }).municipalities ?? [], municipality.id])]
            : undefined,
        }),
      });
    }

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/municipios"), 1500);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/admin/municipios"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Municípios
      </Link>

      <h1 className="text-xl font-semibold text-surface-900 mb-1">{municipality.name}</h1>
      <p className="text-sm text-surface-500 mb-6">Editar dados e vínculos de usuários</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          Salvo com sucesso!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-surface-700">Dados do município</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Código IBGE</label>
                <input
                  type="text"
                  value={form.ibgeCode}
                  onChange={(e) => setForm({ ...form, ibgeCode: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">População</label>
                <input
                  type="number"
                  value={form.population}
                  onChange={(e) => setForm({ ...form, population: e.target.value })}
                  required
                  min={1}
                  className="input"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-brand-600"
              />
              <label htmlFor="isActive" className="text-sm text-surface-700">
                Município ativo
              </label>
            </div>
          </div>
        </div>

        {/* Vínculos de usuários */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-surface-700">Funcionários vinculados</h2>
          </div>
          <div className="card-body">
            {linked.length === 0 && (
              <p className="text-sm text-surface-400 mb-3">Nenhum funcionário vinculado.</p>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              {linked.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 border border-brand-200 rounded-full text-sm text-brand-800"
                >
                  <span>{u.name}</span>
                  <button
                    type="button"
                    onClick={() => setLinked(linked.filter((l) => l.id !== u.id))}
                    className="text-brand-500 hover:text-brand-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {unlinked.length > 0 && (
              <div>
                <label className="label">Adicionar funcionário</label>
                <select
                  className="input"
                  onChange={(e) => {
                    const user = allUsers.find((u) => u.id === e.target.value);
                    if (user) setLinked([...linked, user]);
                    e.target.value = "";
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Selecione...</option>
                  {unlinked.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
          <Link href="/admin/municipios" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
