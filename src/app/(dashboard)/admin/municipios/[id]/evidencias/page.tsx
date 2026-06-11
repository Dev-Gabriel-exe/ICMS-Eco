// src/app/(dashboard)/admin/municipios/[id]/evidencias/page.tsx
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import EvidenciasAdminClient from "./EvidenciasAdminClient";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const m = await db.municipality.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: `Evidências — ${m?.name ?? "Município"}` };
}

export default async function EvidenciasAdminPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [municipality, certame] = await Promise.all([
    db.municipality.findUnique({ where: { id: params.id } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
  ]);

  if (!municipality) notFound();
  if (!certame) redirect(`/admin/municipios/${params.id}`);

  // Busca todos os checklist items com evidências do certame ativo
  const checklistItems = await db.checklistItem.findMany({
    where: { municipalityId: params.id, certameId: certame.id },
    include: {
      criteria: { select: { id: true, description: true, axis: true, axisName: true } },
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
  });

  // Filtra só os que têm evidências
  const itemsWithEvidences = checklistItems.filter(i => i.evidences.length > 0);

  const totalEvidences  = itemsWithEvidences.reduce((acc, i) => acc + i.evidences.length, 0);
  const pendingCount    = itemsWithEvidences.reduce((acc, i) => acc + i.evidences.filter(e => e.validationStatus === "pending").length, 0);
  const approvedCount   = itemsWithEvidences.reduce((acc, i) => acc + i.evidences.filter(e => e.validationStatus === "approved").length, 0);
  const rejectedCount   = itemsWithEvidences.reduce((acc, i) => acc + i.evidences.filter(e => e.validationStatus === "rejected").length, 0);

  return (
    <EvidenciasAdminClient
      municipalityId={params.id}
      municipalityName={municipality.name}
      certameYear={certame.year}
      items={itemsWithEvidences as any}
      stats={{ total: totalEvidences, pending: pendingCount, approved: approvedCount, rejected: rejectedCount }}
    />
  );
}