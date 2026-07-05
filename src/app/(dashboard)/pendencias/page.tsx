import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Building2, ChevronRight, FileCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Pendências" };

async function getUserMunicipalitiesWithPending(userId: string, certameId: string | null) {
  const links = await db.userMunicipality.findMany({
    where: { userId, municipality: { isActive: true } },
    include: {
      municipality: {
        select: {
          id: true,
          name: true,
          population: true,
          ibgeCode: true,
          isActive: true,
          _count: { select: { userMunicipalities: true } },
        },
      },
    },
    orderBy: { municipality: { name: "asc" } },
  });

  if (!certameId) return [];

  const withCounts = await Promise.all(
    links.map(async (link) => {
      const pendingCount = await db.evidence.count({
        where: {
          validationStatus: "pending",
          checklistItem: {
            municipalityId: link.municipality.id,
            certameId,
          },
        },
      });

      return { ...link.municipality, pendingCount };
    })
  );

  return withCounts.filter((item) => item.pendingCount > 0);
}

export default async function PendenciasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const isAdmin = session.user.role === "admin";

  const activeCertame = await db.certame.findFirst({
    where: { isActive: true, isClosed: false },
    orderBy: { year: "desc" },
  });

  const municipalities = isAdmin
    ? activeCertame
      ? await db.municipality.findMany({
          where: {
            isActive: true,
            checklistItems: {
              some: {
                certameId: activeCertame.id,
                evidences: { some: { validationStatus: "pending" } },
              },
            },
          },
          select: {
            id: true,
            name: true,
            population: true,
            ibgeCode: true,
            isActive: true,
            _count: { select: { userMunicipalities: true } },
            checklistItems: {
              where: {
                certameId: activeCertame.id,
                evidences: { some: { validationStatus: "pending" } },
              },
              select: {
                evidences: {
                  where: { validationStatus: "pending" },
                  select: { id: true },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        }).then((rows) =>
          rows.map((m) => ({
            ...m,
            pendingCount: m.checklistItems.reduce((acc, item) => acc + item.evidences.length, 0),
          })).filter((m) => m.pendingCount > 0)
        )
      : []
    : await getUserMunicipalitiesWithPending(
        session.user.id,
        activeCertame?.id ?? null,
      );

  const totalPending = municipalities.reduce((acc, item) => acc + item.pendingCount, 0);

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-25"
        style={{ background: "radial-gradient(circle at 80% 20%, #fdba74 0%, transparent 60%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-15"
        style={{ background: "radial-gradient(circle at 20% 80%, #f59e0b 0%, transparent 60%)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-7xl mx-auto">
        <Link
          href="/municipio"
          className="inline-flex items-center gap-1.5 text-sm text-amber-700/70 hover:text-amber-800 mb-6 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Voltar ao painel
        </Link>

        <div className="mb-8" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Evidências pendentes</h1>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {isAdmin
              ? "Municípios com evidências pendentes aguardando análise"
              : "Municípios com evidências pendentes nos vínculos da sua conta"}
          </p>
        </div>

        <div
          className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          style={{ animation: "fadeSlideUp 0.45s ease both", animationDelay: "120ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                Municípios com pendências
              </span>
              {totalPending > 0 && (
                <span className="rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold px-2.5 py-0.5">
                  {totalPending}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {municipalities.length} município{municipalities.length !== 1 ? "s" : ""}
            </span>
          </div>

          {!activeCertame ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                <FileCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">
                Nenhum certame ativo no momento.
              </p>
            </div>
          ) : municipalities.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-slate-500 font-medium text-sm">Nenhum município com pendências no momento</p>
                <p className="text-slate-400 text-xs mt-1">
                  Quando houver evidências pendentes, elas aparecerão aqui.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {municipalities.map((m, i) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-amber-50/40 transition-colors duration-150"
                  style={{
                    animation: "fadeSlideUp 0.35s ease both",
                    animationDelay: `${160 + i * 30}ms`,
                  }}
                >
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-amber-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">{m.name}</span>
                      {m.ibgeCode && (
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 shrink-0">
                          {m.ibgeCode}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">
                        {m.pendingCount} pendência{m.pendingCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {m.population.toLocaleString("pt-BR")} hab.
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3 h-3" />
                        {m._count.userMunicipalities} funcionário{m._count.userMunicipalities !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/municipio/${m.id}/evidencias?filter=pending&backTo=/pendencias`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all duration-150 hover:-translate-y-px shrink-0"
                  >
                    Ver pendências
                    <ChevronRight className="w-3 h-3" />
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
