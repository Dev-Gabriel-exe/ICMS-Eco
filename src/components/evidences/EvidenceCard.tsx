// src/components/evidences/EvidenceCard.tsx
"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, FileText, ExternalLink, Trash2 } from "lucide-react";
import { formatDateTime, formatFileSize, getFileIcon, cn } from "@/lib/utils";
import type { Evidence } from "@/types";
import ReturnModal from "./ReturnModal";

interface Props {
  evidence: Evidence & {
    uploadedBy?: { name: string; email: string };
    checklistItem?: { criteria: { id: string; description: string } };
  };
  isAdmin?: boolean;
  onReturned?: () => void;
  onDeleted?: () => void;
}

export default function EvidenceCard({ evidence, isAdmin, onReturned, onDeleted }: Props) {
  const [showReturn, setShowReturn] = useState(false);

  function getStatus(): { label: string; color: string; icon: React.ElementType } {
    if (!evidence.isValid) {
      return { label: "Devolvida", color: "badge-blue", icon: RotateCcw };
    }
    const hasIssues = [evidence.hasDate, evidence.dateIsInPeriod, evidence.isOriginalDoc].some(
      (v) => v === false
    );
    const hasMissing = [evidence.hasDate, evidence.dateIsInPeriod, evidence.isOriginalDoc].some(
      (v) => v === null || v === undefined
    );

    if (hasIssues) return { label: "Crítico", color: "badge-red", icon: AlertTriangle };
    if (hasMissing) return { label: "Atenção", color: "badge-amber", icon: AlertTriangle };
    return { label: "Válida", color: "badge-green", icon: CheckCircle2 };
  }

  const { label, color, icon: Icon } = getStatus();

  return (
    <>
      <div className="card p-4 flex items-start gap-3">
        <div className="text-2xl shrink-0">{getFileIcon(evidence.fileType ?? null)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-surface-800 truncate">{evidence.fileName}</span>
            <span className={cn("badge text-xs shrink-0", color)}>
              <Icon className="w-3 h-3" />
              {label}
            </span>
          </div>

          {evidence.checklistItem && (
            <p className="text-xs text-brand-700 font-medium mb-1">
              {evidence.checklistItem.criteria.id} — {evidence.checklistItem.criteria.description}
            </p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-surface-400">
            <span>{formatFileSize(evidence.fileSizeBytes ?? null)}</span>
            <span>·</span>
            <span>{formatDateTime(evidence.uploadedAt)}</span>
            {evidence.uploadedBy && (
              <>
                <span>·</span>
                <span>{evidence.uploadedBy.name}</span>
              </>
            )}
          </div>

          {/* Checklist de validação resumido */}
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { key: "hasDate", label: "Data" },
              { key: "dateIsInPeriod", label: "No período" },
              { key: "isOriginalDoc", label: "Original" },
              { key: "hasGeotag", label: "Geotag" },
              { key: "isPdfSearchable", label: "PDF pesquisável" },
            ].map(({ key, label }) => {
              const val = evidence[key as keyof Evidence];
              if (val === null || val === undefined) return null;
              return (
                <span
                  key={key}
                  className={cn("text-xs px-1.5 py-0.5 rounded", val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}
                >
                  {val ? "✓" : "✗"} {label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={evidence.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            title="Abrir arquivo"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {isAdmin && evidence.isValid && (
            <button
              onClick={() => setShowReturn(true)}
              className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
              title="Devolver para revisão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showReturn && (
        <ReturnModal
          evidenceId={evidence.id}
          fileName={evidence.fileName}
          onClose={() => setShowReturn(false)}
          onReturned={() => {
            setShowReturn(false);
            onReturned?.();
          }}
        />
      )}
    </>
  );
}
