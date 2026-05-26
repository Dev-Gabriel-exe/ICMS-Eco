// src/app/(dashboard)/admin/certames/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils"; 
import Link from "next/link";
import { Plus, CalendarCheck } from "lucide-react";

export const metadata = { title: "Certames" };

export default async function CertamesPage() {
  await requireAdmin();

  const certames = await db.certame.findMany({ orderBy: { year: "desc" } });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Certames</h1>
          <p className="text-sm text-surface-500 mt-0.5">Anos de avaliação do Selo Ambiental</p>
        </div>
        <Link href="/admin/certames/novo" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Novo certame
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Ano</th>
              <th>Período de apuração</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {certames.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-surface-400 py-10">
                  Nenhum certame cadastrado.
                </td>
              </tr>
            )}
            {certames.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-brand-600" />
                    <span className="font-semibold text-surface-800">{c.year}</span>
                  </div>
                </td>
                <td className="text-surface-600">
                  {formatDate(c.periodoInicio)} a {formatDate(c.periodoFim)}
                </td>
                <td>
                  {c.isActive ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="badge badge-green">Ativo</span>
                    </div>
                  ) : (
                    <span className="badge badge-slate">Encerrado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Atenção:</strong> Ao criar um novo certame, o anterior é desativado automaticamente.
          O certame 2026 usa o Decreto anterior (19.042/2020). A partir de 2027, aplica-se o
          Decreto 24.288/2025.
        </p>
      </div>
    </div>
  );
}
