// src/app/(dashboard)/admin/certames/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, CalendarCheck, CalendarRange, Info } from "lucide-react";

export const metadata = { title: "Certames" };

export default async function CertamesPage() {
  await requireAdmin();

  const certames = await db.certame.findMany({ orderBy: { year: "desc" } });

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative overflow-hidden">

      {/* Decorative blobs */}
      <div
        className="pointer-events-none fixed top-[-80px] right-[-80px] w-[420px] h-[420px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #6ee7b7 0%, transparent 70%)", filter: "blur(48px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-[-60px] left-[-60px] w-[320px] h-[320px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="relative max-w-3xl mx-auto">

        {/* Header */}
        <div
          className="flex items-center justify-between mb-8"
          style={{ animation: "fadeSlideUp 0.4s ease both" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
              style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}
            >
              <CalendarRange className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">Certames</h1>
              <p className="text-sm text-slate-500 mt-0.5">Anos de avaliação do Selo Ambiental</p>
            </div>
          </div>

          <Link
            href="/admin/certames/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                       transition-all duration-200 hover:-translate-y-px active:scale-[0.98] shadow-sm"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              boxShadow: "0 4px 14px -4px rgba(5,150,105,0.45)",
            }}
          >
            <Plus className="w-4 h-4" />
            Novo certame
          </Link>
        </div>

        {/* Table card */}
        <div
          className="rounded-3xl border overflow-hidden shadow-sm mb-5"
          style={{
            background: "rgba(255,255,255,0.8)",
            borderColor: "rgba(167,243,208,0.6)",
            backdropFilter: "blur(12px)",
            animation: "fadeSlideUp 0.45s ease both",
            animationDelay: "80ms",
          }}
        >
          {/* Card header strip */}
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(167,243,208,0.5)", background: "rgba(236,253,245,0.6)" }}
          >
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
              Histórico de certames
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {certames.length} {certames.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Ano", "Período de apuração", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold uppercase tracking-widest px-6 py-3.5"
                    style={{ color: "#94a3b8", borderBottom: "1px solid rgba(167,243,208,0.4)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certames.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(167,243,208,0.3)" }}
                      >
                        <CalendarRange className="w-6 h-6 text-emerald-400" />
                      </div>
                      <p className="text-slate-400 text-sm">Nenhum certame cadastrado.</p>
                    </div>
                  </td>
                </tr>
              )}

              {certames.map((c, i) => (
                <tr
                  key={c.id}
                  className="group transition-colors duration-150 hover:bg-emerald-50/50"
                  style={{
                    borderBottom: i < certames.length - 1 ? "1px solid rgba(167,243,208,0.3)" : "none",
                    animation: `fadeSlideUp 0.35s ease both`,
                    animationDelay: `${120 + i * 60}ms`,
                  }}
                >
                  {/* Ano */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: c.isActive ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.1)" }}
                      >
                        <CalendarCheck
                          className="w-4 h-4"
                          style={{ color: c.isActive ? "#059669" : "#94a3b8" }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-base">{c.year}</span>
                    </div>
                  </td>

                  {/* Período */}
                  <td className="px-6 py-4 text-slate-500 text-sm">
                    <span className="font-medium text-slate-600">{formatDate(c.periodoInicio)}</span>
                    <span className="mx-2 text-slate-300">→</span>
                    <span className="font-medium text-slate-600">{formatDate(c.periodoFim)}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {c.isActive ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#059669" }}>
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          style={{ animation: "pulse 2s ease-in-out infinite" }}
                        />
                        Ativo
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(148,163,184,0.12)", color: "#94a3b8" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        Encerrado
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info banner */}
        <div
          className="p-4 rounded-2xl border flex items-start gap-3"
          style={{
            background: "linear-gradient(135deg, rgba(255,251,235,0.9) 0%, rgba(254,243,199,0.6) 100%)",
            borderColor: "rgba(252,211,77,0.4)",
            animation: "fadeSlideUp 0.4s ease both",
            animationDelay: "260ms",
          }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(245,158,11,0.15)" }}
          >
            <Info className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong className="font-semibold">Atenção:</strong> Ao criar um novo certame, o anterior é
            desativado automaticamente. O certame <strong>2026</strong> usa o Decreto anterior (19.042/2020).
            A partir de <strong>2027</strong>, aplica-se o Decreto 24.288/2025.
          </p>
        </div>

      </div>


    </div>
  );
}