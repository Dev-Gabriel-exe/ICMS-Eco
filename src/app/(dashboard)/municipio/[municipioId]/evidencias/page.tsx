// src/app/(dashboard)/municipio/[municipioId]/evidencias/page.tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { formatDateTime, formatFileSize, getFileIcon } from "@/lib/utils";
export const metadata = { title: "Evidências" };

export default async function EvidenciasPage({
  params,
}: {
  params: { municipioId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  const municipality = await db.municipality.findUnique({ where: { id: municipioId } });
  if (!municipality) notFound();

  const activeCertame = await db.certame.findFirst({
    where: { isActive: true },
    orderBy: { year: "desc" },
  });

  const evidences = await db.evidence.findMany({
    where: {
      checklistItem: { municipalityId: municipioId, ...(activeCertame ? { certameId: activeCertame.id } : {}) },
    },
    include: {
      uploader: { select: { name: true } },
      checklistItem: {
        include: {
          criteria: { select: { id: true, description: true, axis: true } },
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
  });

  function getEvidenceStatus(ev: (typeof evidences)[0]) {
  switch (ev.validationStatus) {
    case "approved":
      return "valid";

    case "rejected":
      return "critical";

    case "pending":
    default:
      return "warning";
  }
}

  const statusConfig = {
    valid: { label: "Válida", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-200" },
    warning: { label: "Atenção", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    critical: { label: "Crítico", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
    returned: { label: "Devolvida", icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href={`/municipio/${municipioId}`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Painel
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-surface-900">Evidências — {municipality.name}</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {evidences.length} arquivo(s) enviado(s)
            {activeCertame && ` no certame ${activeCertame.year}`}
          </p>
        </div>
      </div>

      {evidences.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">Nenhuma evidência enviada ainda.</p>
          <p className="text-sm text-surface-400 mt-1">
            Acesse o checklist de cada eixo para enviar evidências.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {evidences.map((ev) => {
            const st = getEvidenceStatus(ev);
            const cfg = statusConfig[st];
            const Icon = cfg.icon;

            return (
              <div key={ev.id} className={`card flex items-center gap-4 px-5 py-4 border ${cfg.bg}`}>
                <div className="text-2xl">{getFileIcon(ev.fileType)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-surface-800 truncate">{ev.fileName}</span>
                    <span className={`badge text-xs font-medium ${
                      st === "valid" ? "badge-green" :
                      st === "warning" ? "badge-amber" :
                      st === "critical" ? "badge-red" : "badge-blue"
                    }`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    <span className="font-medium text-brand-700">
                      {ev.checklistItem.criteria.id} — {ev.checklistItem.criteria.description}
                    </span>
                    <span>·</span>
                    <span>{formatFileSize(ev.fileSizeBytes)}</span>
                    <span>·</span>
                    <span>{formatDateTime(ev.uploadedAt)}</span>
                    <span>·</span>
                    <span>{ev.uploader.name}</span>
                  </div>
                </div>

                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm shrink-0"
                >
                  Ver arquivo
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
