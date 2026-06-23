// src/components/checklist/CriterionRow.tsx
"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, Circle, XCircle,
  ChevronRight, FileText,
} from "lucide-react";
import { calculateItemPoints } from "@/lib/scoring";
import type { ChecklistItem, Criteria, Evidence } from "@/types";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const CriterionModal = dynamic(
  () => import("@/components/checklist/CriterionModal"),
  { ssr: false }
);

type SubDocStatus = "not_started" | "pending" | "approved" | "rejected";

function deriveSubDocStatus(evidences: Evidence[]): SubDocStatus {
  if (evidences.length === 0) return "not_started";
  if (evidences.some((e) => e.validationStatus === "approved")) return "approved";
  if (evidences.some((e) => e.validationStatus === "rejected")) return "rejected";
  return "pending";
}

const STATUS_PILL = {
  not_started: { icon: Circle,       cls: "bg-slate-100 text-slate-400",  label: "Não enviado" },
  pending:     { icon: Clock,        cls: "bg-amber-50  text-amber-600",   label: "Aguardando"  },
  approved:    { icon: CheckCircle2, cls: "bg-green-50  text-green-600",   label: "Aprovado"    },
  rejected:    { icon: XCircle,      cls: "bg-red-50    text-red-500",     label: "Reprovado"   },
} as const;

function DocStatusPill({ label, status }: { label: string; status: SubDocStatus }) {
  const cfg  = STATUS_PILL[status];
  const Icon = cfg.icon;
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold truncate max-w-[140px]",
        cfg.cls
      )}
    >
      <Icon size={9} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

interface Props {
  criterion: Criteria;
  item?: ChecklistItem;
  municipalityId: string;
  certameId: string;
  population: number;
}

export default function CriterionRow({
  criterion,
  item,
  municipalityId,
  certameId,
  population,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [localItem, setLocalItem] = useState<ChecklistItem | undefined>(item);

  const evidences  = (localItem?.evidences ?? []) as Evidence[];
  const hasSubDocs = (criterion.subDocs?.length ?? 0) > 0;

  const fakeItem = {
    status:          localItem?.status         ?? "not_started",
    quantity:        localItem?.quantity        ?? null,
    percentageValue: localItem?.percentageValue ?? null,
    faixaLevel:      localItem?.faixaLevel      ?? null,
  } as unknown as ChecklistItem;
  const points = calculateItemPoints(fakeItem, criterion, population);
  const status = localItem?.status ?? "not_started";

  const cardBorder: Record<ChecklistItem["status"], string> = {
    complete:    "border-green-200  bg-green-50/30",
    in_progress: "border-amber-200  bg-amber-50/20",
    not_started: "border-slate-200  bg-white",
    returned:    "border-blue-200   bg-blue-50/20",
  };

  const statusBadge: Record<ChecklistItem["status"], string> = {
    complete:    "bg-green-100  text-green-700",
    in_progress: "bg-amber-100  text-amber-700",
    not_started: "bg-slate-100  text-slate-500",
    returned:    "bg-blue-100   text-blue-700",
  };

  const statusLabel: Record<ChecklistItem["status"], string> = {
    complete:    "Completo",
    in_progress: "Em andamento",
    not_started: "Não iniciado",
    returned:    "Devolvido",
  };

  const subDocSummary = hasSubDocs
    ? (criterion.subDocs ?? [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((sd) => ({
          id:     sd.id,
          label:  sd.label,
          status: deriveSubDocStatus(evidences.filter((e) => e.subDocId === sd.id)),
        }))
    : [];

  const pendingCount = subDocSummary.filter(
    (s) => s.status === "not_started" || s.status === "rejected"
  ).length;

  const allApproved =
    hasSubDocs && subDocSummary.length > 0 && subDocSummary.every((s) => s.status === "approved");

  function handleClose() {
    setModalOpen(false);
  }

  function handleSaved(updated: ChecklistItem) {
    setLocalItem(updated);
    // NÃO fecha o modal ao salvar — deixa o usuário fechar quando quiser
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={cn(
          "w-full text-left rounded-2xl border transition-all duration-150",
          "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
          cardBorder[status]
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
              status === "complete"
                ? "bg-green-600 text-white"
                : status === "in_progress"
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600"
            )}
          >
            {criterion.id}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {criterion.description}
              </span>
              {allApproved && (
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold",
                statusBadge[status]
              )}>
                {statusLabel[status]}
              </span>

              <span className="text-[11px] text-slate-400">
                {points > 0 ? (
                  <span className="text-brand-600 font-semibold">{points}</span>
                ) : (
                  <span>0</span>
                )}
                {" / "}
                {criterion.maxPoints} pts
              </span>

              {hasSubDocs && pendingCount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-semibold">
                  <FileText size={9} />
                  {pendingCount} doc{pendingCount > 1 ? "s" : ""} pendente{pendingCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <ChevronRight size={16} className="text-slate-300 shrink-0" />
        </div>

        {hasSubDocs && subDocSummary.length > 0 && (
          <div className={cn(
            "px-4 pb-3 border-t flex flex-wrap gap-1.5",
            status === "complete"    ? "border-green-100" :
            status === "in_progress" ? "border-amber-100" : "border-slate-100"
          )}>
            <div className="w-full pt-2.5 flex flex-wrap gap-1.5">
              {subDocSummary.map((sd) => (
                <DocStatusPill key={sd.id} label={sd.label} status={sd.status} />
              ))}
            </div>
          </div>
        )}

        {!hasSubDocs && (
          <div className="px-4 pb-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
              {criterion.requirement}
            </p>
          </div>
        )}
      </button>

      {/* Modal renderizado fora do button, no portal */}
      {modalOpen && (
        <CriterionModal
          criterion={criterion}
          item={localItem}
          municipalityId={municipalityId}
          certameId={certameId}
          population={population}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}