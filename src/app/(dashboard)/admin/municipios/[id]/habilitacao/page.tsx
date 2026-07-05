// src/app/(dashboard)/admin/municipios/[id]/habilitacao/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { HabDocCode } from "@prisma/client";
import AdminHabilitacaoClient from "./AdminHabilitacaoClient";

export const metadata = { title: "Validar Habilitação" };

const ALL_CODES: HabDocCode[] = [
  "CONSELHO_CRIACAO", "CONSELHO_ATA",
  "SECRETARIA_CRIACAO", "SECRETARIA_NOMEACAO", "SECRETARIA_QUADRO",
  "PLANO_DIRETOR",
];

export default async function AdminHabilitacaoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { backTo?: string; from?: string };
}) {
  await requireAdmin();

  const [municipality, activeCertame] = await Promise.all([
    db.municipality.findUnique({ where: { id: params.id } }),
    db.certame.findFirst({ where: { isActive: true } }),
  ]);

  if (!municipality) notFound();
  if (!activeCertame) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-slate-500">Nenhum certame ativo encontrado.</p>
      </div>
    );
  }

  // Busca docs existentes
  const existingDocs = await db.habilitacaoDoc.findMany({
    where:   { municipalityId: params.id, certameId: activeCertame.id },
    include: {
      files: {
        orderBy: { uploadedAt: "desc" },
        include: { uploader: { select: { name: true, email: true } } },
      },
      validator: { select: { name: true } },
    },
  });

  // Preenche slots virtuais para códigos sem registro
  const existingMap = new Map(existingDocs.map(d => [d.code, d]));
  const allDocs = ALL_CODES.map(code => {
    const d = existingMap.get(code);
    if (d) return d;
    return {
      id:             null,
      code,
      status:         "not_started" as const,
      rejectReason:   null,
      validatedAt:    null,
      validator:      null,
      files:          [],
      municipalityId: params.id,
      certameId:      activeCertame.id,
      updatedAt:      null,
    };
  });

  const REQUIRED: HabDocCode[] = ["CONSELHO_CRIACAO", "CONSELHO_ATA", "SECRETARIA_CRIACAO", "SECRETARIA_NOMEACAO", "SECRETARIA_QUADRO"];
  const isHabilitado = REQUIRED.every(c => allDocs.find(d => d.code === c)?.status === "approved");

  return (
    <AdminHabilitacaoClient
      municipioId={params.id}
      municipalityName={municipality.name}
      certameYear={activeCertame.year}
      backTo={
        typeof searchParams?.backTo === "string" && searchParams.backTo.startsWith("/")
          ? searchParams.backTo
          : typeof searchParams?.from === "string" && searchParams.from.startsWith("/")
            ? searchParams.from
            : "/admin/municipios"
      }
      docs={allDocs as Parameters<typeof AdminHabilitacaoClient>[0]["docs"]}
      isHabilitado={isHabilitado}
    />
  );
}
