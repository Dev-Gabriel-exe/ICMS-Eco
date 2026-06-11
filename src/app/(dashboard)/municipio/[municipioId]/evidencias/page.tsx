// src/app/(dashboard)/municipio/[municipioId]/evidencias/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import EvidenciasClient from "./EvidenciasClient";

export const metadata = { title: "Evidências" };

export default async function EvidenciasPage({
  params,
}: {
  params: { municipioId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  // Verifica acesso
  if (session.user.role !== "admin") {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) notFound();
  }

  const [municipality, activeCertame] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
  ]);

  if (!municipality) notFound();

  // Busca todos os checklist items que têm evidências
  const checklistItems = activeCertame
    ? await db.checklistItem.findMany({
        where: { municipalityId: municipioId, certameId: activeCertame.id },
        include: {
          criteria: {
            include: {
              subDocs: { orderBy: { order: "asc" } },
            },
          },
          evidences: {
            include: {
              uploader:  { select: { id: true, name: true, email: true } },
              validator: { select: { id: true, name: true } },
              subDoc:    { select: { id: true, label: true, code: true } },
            },
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { criteriaId: "asc" },
      })
    : [];

  const isAdmin = session.user.role === "admin";

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10 relative">
      {/* Blobs decorativos */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-25"
        style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-15"
        style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }} />

      <div className="relative max-w-4xl mx-auto">
        {/* Voltar */}
        <Link href={`/municipio/${municipioId}`}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 mb-6 group transition-colors"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}>
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Painel
        </Link>

        {/* Header */}
        <div className="mb-7" style={{ animation: "fadeSlideUp 0.38s ease both", animationDelay: "40ms" }}>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Evidências</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {municipality.name}{activeCertame ? ` · Certame ${activeCertame.year}` : ""}
          </p>
        </div>

        {!activeCertame ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
            <FileText className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">Nenhum certame ativo no momento.</p>
          </div>
        ) : (
          <EvidenciasClient
            municipioId={municipioId}
            items={checklistItems as any}
            isAdmin={isAdmin}
          />
        )}
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