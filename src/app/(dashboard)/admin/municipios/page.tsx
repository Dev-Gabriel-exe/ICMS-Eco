// src/app/(dashboard)/admin/municipios/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Building2, Plus } from "lucide-react";

export const metadata = { title: "Municípios" };

export default async function MunicipiosPage() {
  await requireAdmin();

  const municipalities = await db.municipality.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { userMunicipalities: true } },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Municípios</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {municipalities.filter((m) => m.isActive).length} município(s) ativo(s)
          </p>
        </div>
        <Link href="/admin/municipios/novo" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Novo município
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Município</th>
              <th>Código IBGE</th>
              <th>População</th>
              <th>Funcionários</th>
              <th>Cadastro</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {municipalities.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-surface-400 py-10">
                  Nenhum município cadastrado.
                </td>
              </tr>
            )}
            {municipalities.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-brand-700" />
                    </div>
                    <span className="font-medium text-surface-800">{m.name}</span>
                  </div>
                </td>
                <td className="font-mono text-xs text-surface-500">{m.ibgeCode ?? "—"}</td>
                <td>{formatPopulation(m.population)}</td>
                <td>{m._count.userMunicipalities}</td>
                <td className="text-surface-400 text-xs">{formatDate(m.createdAt)}</td>
                <td>
                  <span className={`badge ${m.isActive ? "badge-green" : "badge-slate"}`}>
                    {m.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/municipio/${m.id}`}
                      className="text-brand-600 text-sm font-medium hover:text-brand-700"
                    >
                      Painel
                    </Link>
                    <Link
                      href={`/admin/municipios/${m.id}`}
                      className="text-surface-500 text-sm hover:text-surface-700"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
