// src/app/(dashboard)/admin/municipios/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Building2, Plus } from "lucide-react";
import { MunicipiosTable } from "./MunicipiosTable";

export const metadata = { title: "Municípios" };

export default async function MunicipiosPage() {
  await requireAdmin();

  const municipalities = await db.municipality.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { userMunicipalities: true } } },
  });

  const activeCount = municipalities.filter((m) => m.isActive).length;

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative overflow-hidden">

      <div className="pointer-events-none fixed top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)", filter: "blur(48px)" }} />
      <div className="pointer-events-none fixed bottom-[-60px] left-[-60px] w-[320px] h-[320px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", filter: "blur(40px)" }} />

      <div className="relative max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-8 animate-fade-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}>
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Municípios</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-semibold text-emerald-700">{activeCount}</span>{" "}
                município{activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}
                {municipalities.length > 0 && (
                  <span className="text-slate-400"> · {municipalities.length} no total</span>
                )}
              </p>
            </div>
          </div>

          <Link
            href="/admin/municipios/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                       transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              boxShadow: "0 4px 14px -4px rgba(5,150,105,0.45)",
            }}
          >
            <Plus className="w-4 h-4" />
            Novo município
          </Link>
        </div>

        <MunicipiosTable initialData={municipalities} />
      </div>
    </div>
  );
}