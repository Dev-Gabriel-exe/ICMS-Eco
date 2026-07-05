// src/app/(dashboard)/municipio/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  CalendarRange,
  MapPin,
  AlertCircle,
  Users,
  ExternalLink,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Painel Geral" };

async function getUserMunicipalities(userId: string) {
  return db.userMunicipality.findMany({
    where: { userId, municipality: { isActive: true } },
    include: {
      municipality: {
        select: {
          id: true,
          name: true,
          population: true,
          ibgeCode: true,
          isActive: true,
        },
      },
    },
    orderBy: { municipality: { name: "asc" } },
  });
}

async function getActiveCertame() {
  return db.certame.findFirst({
    where: { isActive: true, isClosed: false },
    orderBy: { year: "desc" },
  });
}

async function getPendingEvidenceCount(userId: string, certameId: string | null) {
  if (!certameId) return 0;

  const municipalities = await db.userMunicipality.findMany({
    where: { userId },
    select: { municipalityId: true },
  });

  const municipalityIds = municipalities.map((item) => item.municipalityId);
  if (municipalityIds.length === 0) return 0;

  return db.evidence.count({
    where: {
      validationStatus: "pending",
      checklistItem: {
        municipalityId: { in: municipalityIds },
        certameId,
      },
    },
  });
}

export default async function MunicipalityHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "admin") redirect("/admin");

  const [municipalities, activeCertame] = await Promise.all([
    getUserMunicipalities(session.user.id),
    getActiveCertame(),
  ]);
  const pendingEvidenceCount = await getPendingEvidenceCount(
    session.user.id,
    activeCertame?.id ?? null
  );

  const linkedMunicipalities = municipalities.map((item) => item.municipality);

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-30"
        style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20"
        style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="mb-8" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Painel Geral</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Visão consolidada de todos os municípios — ICMS-Eco
          </p>
        </div>

        {activeCertame && (
          <div
            className="mb-7 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 flex items-center justify-between gap-4"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "60ms" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
              >
                <CalendarRange className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-800">
                  Certame {activeCertame.year} em andamento
                </span>
                <span className="text-sm text-slate-500">
                  · {formatDate(activeCertame.periodoInicio)} → {formatDate(activeCertame.periodoFim)}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            </div>
            <div className="w-[93px]" aria-hidden="true" />
          </div>
        )}

        {pendingEvidenceCount > 0 && (
          <Link
            href="/pendencias"
            className="mb-7 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-4 flex items-center justify-between gap-4 hover:border-amber-300 hover:shadow-sm transition-all duration-200"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "110ms" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)" }}
              >
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-800">
                    Evidências pendentes
                  </span>
                  <span className="rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold px-2 py-0.5">
                    {pendingEvidenceCount}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Existem evidências aguardando análise nos municípios vinculados à sua conta.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 whitespace-nowrap shrink-0">
              Ver pendências <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        )}

        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "180ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Municípios vinculados
              </span>
            </div>
          </div>

          {linkedMunicipalities.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">
                Nenhum município vinculado à sua conta.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {linkedMunicipalities.map((municipality, index) => (
                <div
                  key={municipality.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-emerald-50/40 transition-colors duration-150"
                  style={{
                    animation: "fadeSlideUp 0.35s ease both",
                    animationDelay: `${220 + index * 30}ms`,
                  }}
                >
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{municipality.name}</span>
                      {municipality.ibgeCode && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {municipality.ibgeCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {municipality.population.toLocaleString("pt-BR")} hab.
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                          municipality.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            municipality.isActive ? "bg-emerald-500" : "bg-slate-400"
                          )}
                        />
                        {municipality.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/municipio/${municipality.id}?backTo=/municipio`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-150 hover:-translate-y-px shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver painel
                  </Link>
                </div>
              ))}
            </div>
          )}
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
