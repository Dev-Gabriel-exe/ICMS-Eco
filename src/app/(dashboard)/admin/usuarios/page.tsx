// src/app/(dashboard)/admin/usuarios/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { UsuariosTable } from "./UsuariosTable";

export const metadata = { title: "Funcionários" };

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

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">
      {/* Blobs */}
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-30"
        style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20"
        style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-5xl mx-auto">

        {/* Header */}
        <div
          className="flex items-center justify-between mb-7"
          style={{ animation: "fadeSlideUp 0.4s ease both" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
            >
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Funcionários</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-semibold text-emerald-700">{activeCount}</span> ativo{activeCount !== 1 ? "s" : ""}
                <span className="text-slate-400"> · {users.length} no total</span>
              </p>
            </div>
          </div>

          <Link
            href="/admin/usuarios/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              boxShadow: "0 4px 14px -4px rgba(5,150,105,0.5)",
            }}
          >
            <Plus className="w-4 h-4" />
            Novo funcionário
          </Link>
        </div>

        {/* Stat cards */}
        <div
          className="grid grid-cols-3 gap-4 mb-5"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
        >
          {[
            { label: "Total",    value: users.length,               color: "text-slate-700",   bg: "bg-white border-slate-200"        },
            { label: "Ativos",   value: activeCount,                color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Inativos", value: users.length - activeCount, color: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border px-5 py-4 ${s.bg}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Card tabela */}
        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "120ms" }}
        >
          {/* Header do card */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Equipe cadastrada
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {users.length} {users.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <UsuariosTable initialData={users} />
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}