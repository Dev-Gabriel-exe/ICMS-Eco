// src/app/(dashboard)/admin/usuarios/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserCheck, UserX, Mail } from "lucide-react";

export const metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    where: { role: "employee" },
    orderBy: { name: "asc" },
    include: {
      userMunicipalities: {
        include: { municipality: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Funcionários</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            Gerencie o acesso da equipe ao sistema
          </p>
        </div>
        <Link href="/admin/usuarios/novo" className="btn btn-primary">
          + Novo funcionário
        </Link>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Municípios vinculados</th>
              <th>Status</th>
              <th>Cadastro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-surface-400 py-10">
                  Nenhum funcionário cadastrado ainda.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-brand-700 text-xs font-semibold">
                        {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <span className="font-medium text-surface-800">{u.name}</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5 text-surface-500">
                    <Mail className="w-3.5 h-3.5" />
                    {u.email}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {u.userMunicipalities.length === 0 ? (
                      <span className="text-surface-400 text-xs">Nenhum</span>
                    ) : (
                      u.userMunicipalities.slice(0, 3).map(({ municipality }) => (
                        <span key={municipality.name} className="badge badge-slate">
                          {municipality.name}
                        </span>
                      ))
                    )}
                    {u.userMunicipalities.length > 3 && (
                      <span className="badge badge-slate">+{u.userMunicipalities.length - 3}</span>
                    )}
                  </div>
                </td>
                <td>
                  {u.isActive ? (
                    <span className="badge badge-green">
                      <UserCheck className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <span className="badge badge-slate">
                      <UserX className="w-3 h-3" /> Inativo
                    </span>
                  )}
                </td>
                <td className="text-surface-400 text-xs">{formatDate(u.createdAt)}</td>
                <td>
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="text-brand-600 text-sm font-medium hover:text-brand-700"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}