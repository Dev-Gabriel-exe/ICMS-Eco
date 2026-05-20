// src/app/(dashboard)/admin/usuarios/[id]/UserEditForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, X } from "lucide-react";

interface Municipality {
  id: string;
  name: string;
}

interface Props {
  user: { id: string; name: string; email: string; isActive: boolean };
  linkedMunicipalities: Municipality[];
  allMunicipalities: Municipality[];
}

export default function UserEditForm({ user, linkedMunicipalities, allMunicipalities }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ name: user.name, isActive: user.isActive });
  const [linked, setLinked] = useState<Municipality[]>(linkedMunicipalities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const unlinked = allMunicipalities.filter((m) => !linked.find((l) => l.id === m.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        isActive: form.isActive,
        municipalityIds: linked.map((m) => m.id),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/admin/usuarios"), 1500);
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Funcionários
      </Link>

      <h1 className="text-xl font-semibold text-surface-900 mb-1">{user.name}</h1>
      <p className="text-sm text-surface-500 mb-6">{user.email}</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">Salvo!</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-surface-700">Dados pessoais</h2>
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
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 accent-brand-600"
              />
              <label htmlFor="isActive" className="text-sm text-surface-700">Usuário ativo</label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-sm font-semibold text-surface-700">Municípios vinculados</h2>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2 mb-4 min-h-8">
              {linked.length === 0 && (
                <p className="text-sm text-surface-400">Nenhum município vinculado.</p>
              )}
              {linked.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 border border-brand-200 rounded-full text-sm text-brand-800"
                >
                  {m.name}
                  <button
                    type="button"
                    onClick={() => setLinked(linked.filter((l) => l.id !== m.id))}
                    className="text-brand-400 hover:text-brand-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {unlinked.length > 0 && (
              <div>
                <label className="label">Adicionar município</label>
                <select
                  className="input"
                  defaultValue=""
                  onChange={(e) => {
                    const m = allMunicipalities.find((m) => m.id === e.target.value);
                    if (m) setLinked([...linked, m]);
                    e.target.value = "";
                  }}
                >
                  <option value="" disabled>Selecione...</option>
                  {unlinked.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <Link href="/admin/usuarios" className="btn btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
