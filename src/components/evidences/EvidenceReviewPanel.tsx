// src/components/evidences/EvidenceReviewPanel.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  Trash2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { RejectEvidenceModal } from "./RejectEvidenceModal";
import { TechnicalChecklist } from "./TechnicalChecklist";

interface EvidenceReviewPanelProps {
  evidence: {
    id: string;
    validationStatus: "pending" | "approved" | "rejected";

    reviewComment?: string | null;

    validatedAt?: Date | string | null;

    validator?: {
      name: string;
    } | null;

    hasDate?: boolean | null;
    dateIsInPeriod?: boolean | null;
    hasGeotag?: boolean | null;
    isPdfSearchable?: boolean | null;
    hasElectronicSignature?: boolean | null;
    followsAnnexII?: boolean | null;
    isOriginalDoc?: boolean | null;
  };
}

export function EvidenceReviewPanel({
  evidence,
}: EvidenceReviewPanelProps) {
  const router = useRouter();

  const [comment, setComment] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  async function approveEvidence() {
    startTransition(async () => {
      await fetch(`/api/evidences/${evidence.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          comment,
        }),
      });

      router.refresh();
    });
  }

  async function rejectEvidence(reason: string) {
    await fetch(`/api/evidences/${evidence.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "reject",
        comment: reason,
      }),
    });

    router.refresh();
  }

  async function deleteEvidence() {
    const confirmed = confirm(
      "Deseja realmente excluir esta evidência?"
    );

    if (!confirmed) return;

    await fetch(`/api/evidences/${evidence.id}`, {
      method: "DELETE",
    });

    router.refresh();
  }

  return (
    <div className="mt-4">
      {/* ================= ADMIN REVIEW ================= */}
      {evidence.validationStatus === "pending" && (
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Revisão administrativa
              </h3>

              <p className="text-xs text-slate-500">
                Analise a evidência antes de aprovar ou rejeitar
              </p>
            </div>
          </div>

          {/* Comentário */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Comentário interno
            </label>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Comentário opcional..."
              className="
                w-full rounded-2xl border border-slate-200
                bg-white px-4 py-3 text-sm text-slate-700
                outline-none resize-none
                focus:ring-4 focus:ring-amber-100
                focus:border-amber-300
                transition
              "
            />
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={isPending}
              onClick={approveEvidence}
              className="
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-2xl
                bg-emerald-600 text-white
                text-sm font-semibold
                hover:bg-emerald-700
                shadow-sm
                transition
                disabled:opacity-50
              "
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}

              Aprovar
            </button>

            <button
              onClick={() => setRejectOpen(true)}
              className="
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-2xl
                bg-red-600 text-white
                text-sm font-semibold
                hover:bg-red-700
                shadow-sm
                transition
              "
            >
              <XCircle className="w-4 h-4" />
              Rejeitar
            </button>

            <button
              onClick={deleteEvidence}
              className="
                inline-flex items-center gap-2
                px-4 py-2.5 rounded-2xl
                border border-red-200
                bg-white
                text-red-700
                text-sm font-semibold
                hover:bg-red-50
                hover:border-red-300
                transition
              "
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>

          {/* Checklist técnico */}
          <div className="mt-5">
            <TechnicalChecklist
              evidenceId={evidence.id}
              initialValues={{
                hasDate: evidence.hasDate,
                dateIsInPeriod: evidence.dateIsInPeriod,
                hasGeotag: evidence.hasGeotag,
                isPdfSearchable: evidence.isPdfSearchable,
                hasElectronicSignature:
                  evidence.hasElectronicSignature,
                followsAnnexII: evidence.followsAnnexII,
                isOriginalDoc: evidence.isOriginalDoc,
              }}
            />
          </div>
        </div>
      )}

      {/* ================= APROVADA ================= */}
      {evidence.validationStatus === "approved" && (
        <div
          className="
            mt-4 rounded-3xl
            border border-emerald-200
            bg-gradient-to-br from-emerald-50 to-white
            p-5
          "
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-bold text-emerald-900">
                  Evidência aprovada
                </p>

                <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                  Validada
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-emerald-950">
                {evidence.validator?.name && (
                  <p>
                    <strong>Aprovado por:</strong>{" "}
                    {evidence.validator.name}
                  </p>
                )}

                {evidence.validatedAt && (
                  <p>
                    <strong>Data:</strong>{" "}
                    {new Date(
                      evidence.validatedAt
                    ).toLocaleString("pt-BR")}
                  </p>
                )}

                {evidence.reviewComment && (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-white/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide font-bold text-emerald-700 mb-1">
                      Comentário
                    </p>

                    <p>{evidence.reviewComment}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJEITADA ================= */}
      {evidence.validationStatus === "rejected" && (
        <div
          className="
            mt-4 rounded-3xl
            border border-red-200
            bg-gradient-to-br from-red-50 to-white
            p-5
          "
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-700" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-red-900">
                    Evidência rejeitada
                  </p>

                  <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                    Correção necessária
                  </span>
                </div>

                {/* BOTÃO EXCLUIR */}
                <button
                  onClick={deleteEvidence}
                  className="
                    inline-flex items-center gap-2
                    px-3 py-2 rounded-2xl
                    border border-red-200
                    bg-white
                    text-red-700
                    text-xs font-bold
                    hover:bg-red-100
                    hover:border-red-300
                    transition
                  "
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir evidência
                </button>
              </div>

              <div className="space-y-1.5 text-sm text-red-950">
                {evidence.validator?.name && (
                  <p>
                    <strong>Rejeitado por:</strong>{" "}
                    {evidence.validator.name}
                  </p>
                )}

                {evidence.validatedAt && (
                  <p>
                    <strong>Data:</strong>{" "}
                    {new Date(
                      evidence.validatedAt
                    ).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>

              {evidence.reviewComment && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-white/80 px-4 py-4">
                  <p className="text-xs uppercase tracking-wide font-bold text-red-700 mb-1">
                    Motivo da rejeição
                  </p>

                  <p className="text-sm text-red-950 leading-relaxed">
                    {evidence.reviewComment}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <RejectEvidenceModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={rejectEvidence}
      />
    </div>
  );
}