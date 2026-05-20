// src/app/(dashboard)/admin/page.tsx
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2, Users, FileCheck, AlertTriangle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Painel Geral" };

async function getStats() {
  const [municipalities, users, activeCertame] = await Promise.all([
    db.municipality.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: true, role: "employee" } }),
    db.certame.findFirst({ where: { isActive: true, isClosed: false }, orderBy: { year: "desc" } }),
  ]);

  const pendingEvidences = await db.evidence.count({
    where: { validationStatus: "pending" },
  });

  return { municipalities, users, activeCertame, pendingEvidences };
}

async function getMunicipalities() {
  return db.municipality.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, municipalities] = await Promise.all([getStats(), getMunicipalities()]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-surface-900">Painel Geral</h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Visão consolidada de todos os municípios — ICMS-Eco
        </p>
      </div>

      {/* Certame ativo */}
      {stats.activeCertame && (
        <div className="mb-6 p-4 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <div>
              <span className="text-brand-800 font-semibold text-sm">
                Certame {stats.activeCertame.year} ativo
              </span>
              <span className="text-brand-600 text-sm ml-2">
                Período: {formatDate(stats.activeCertame.periodoInicio)} a{" "}
                {formatDate(stats.activeCertame.periodoFim)}
              </span>
            </div>
          </div>
          <Link
            href="/admin/certames"
            className="text-brand-700 text-sm font-medium hover:text-brand-900 transition-colors"
          >
            Gerenciar →
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Building2}
          label="Municípios ativos"
          value={stats.municipalities}
          color="green"
          href="/admin/municipios"
        />
        <StatCard
          icon={Users}
          label="Funcionários"
          value={stats.users}
          color="blue"
          href="/admin/usuarios"
        />
        <StatCard
          icon={FileCheck}
          label="Evidências pendentes"
          value={stats.pendingEvidences}
          color={stats.pendingEvidences > 0 ? "amber" : "green"}
          href="/admin/municipios"
        />
        <StatCard
          icon={TrendingUp}
          label="Certame ativo"
          value={stats.activeCertame ? stats.activeCertame.year : "—"}
          color="slate"
          href="/admin/certames"
        />
      </div>

      {/* Lista de municípios */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-surface-800">Municípios</h2>
          <Link
            href="/admin/municipios/novo"
            className="btn btn-primary btn-sm"
          >
            + Novo município
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Município</th>
                <th>Código IBGE</th>
                <th>População</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {municipalities.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-surface-400 py-8">
                    Nenhum município cadastrado ainda.
                  </td>
                </tr>
              )}
              {municipalities.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-surface-800">{m.name}</td>
                  <td className="text-surface-500 font-mono text-xs">
                    —
                  </td>
                  <td>{m.population.toLocaleString("pt-BR")}</td>
                  <td>
                    <span className={`badge ${m.isActive ? "badge-green" : "badge-slate"}`}>
                      {m.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/municipio/${m.id}`}
                      className="text-brand-600 text-sm font-medium hover:text-brand-700"
                    >
                      Ver painel →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: "green" | "blue" | "amber" | "slate";
  href: string;
}) {
  const colors = {
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-surface-100 text-surface-600",
  };

  return (
    <Link href={href}>
      <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-surface-900">{value}</div>
          <div className="text-xs text-surface-500 mt-0.5">{label}</div>
        </div>
      </div>
    </Link>
  );
}