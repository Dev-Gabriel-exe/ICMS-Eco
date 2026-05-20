// src/components/checklist/EvidenceChecklist.tsx
"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Evidence } from "@/types";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type CheckField = keyof Pick<
  Evidence,
  | "hasDate"
  | "dateIsInPeriod"
  | "hasGeotag"
  | "isPdfSearchable"
  | "hasElectronicSignature"
  | "followsAnnexII"
  | "isOriginalDoc"
>;

interface CheckItem {
  field: CheckField;
  label: string;
  description: string;
  appliesTo: "all" | "image" | "pdf";
  isCritical: boolean; // vermelho se false
}

// ─────────────────────────────────────────────
// Checklist definido pelo edital (Decreto 24.288/2025)
// ─────────────────────────────────────────────

const CHECK_ITEMS: CheckItem[] = [
  {
    field: "hasDate",
    label: "Possui data",
    description: "O documento ou foto contém data visível.",
    appliesTo: "all",
    isCritical: true,
  },
  {
    field: "dateIsInPeriod",
    label: "Data no período de apuração",
    description: "A data está dentro do período de apuração do certame.",
    appliesTo: "all",
    isCritical: true,
  },
  {
    field: "isOriginalDoc",
    label: "Documento original (não duplicado)",
    description:
      "Esta evidência não está sendo usada em nenhum outro critério (art. 16 §2°).",
    appliesTo: "all",
    isCritical: true,
  },
  {
    field: "hasGeotag",
    label: "Possui georreferenciamento",
    description:
      "A imagem contém coordenadas geográficas visíveis como marca d'água (geotag).",
    appliesTo: "image",
    isCritical: false,
  },
  {
    field: "isPdfSearchable",
    label: "PDF pesquisável",
    description:
      "O PDF não é um scan — o texto pode ser selecionado e copiado.",
    appliesTo: "pdf",
    isCritical: false,
  },
  {
    field: "hasElectronicSignature",
    label: "Assinatura eletrônica verificável",
    description:
      "O documento possui assinatura eletrônica com autenticidade verificável (art. 16).",
    appliesTo: "pdf",
    isCritical: false,
  },
  {
    field: "followsAnnexII",
    label: "Segue modelo Relatório Operacional (Anexo II)",
    description:
      "O documento segue o modelo oficial do Relatório Operacional exigido pelo edital.",
    appliesTo: "pdf",
    isCritical: false,
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

function isPdfFile(fileType: string): boolean {
  return fileType === "application/pdf";
}

function getApplicableChecks(fileType: string): CheckItem[] {
  return CHECK_ITEMS.filter((c) => {
    if (c.appliesTo === "all") return true;
    if (c.appliesTo === "image") return isImageFile(fileType);
    if (c.appliesTo === "pdf") return isPdfFile(fileType);
    return false;
  });
}

function computeStatus(
  evidence: Partial<Evidence>,
  fileType: string
): "valid" | "warning" | "critical" {
  const checks = getApplicableChecks(fileType);
  const criticals = checks.filter((c) => c.isCritical);

  const hasCriticalFail = criticals.some(
    (c) => evidence[c.field] === false
  );
  if (hasCriticalFail) return "critical";

  const hasAnyNull = checks.some(
    (c) => evidence[c.field] == null
  );
  if (hasAnyNull) return "warning";

  return "valid";
}

// ─────────────────────────────────────────────
// Ícone de resposta
// ─────────────────────────────────────────────

function AnswerIcon({ value }: { value: boolean | null | undefined }) {
  if (value === true)
    return <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
  if (value === false)
    return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  return <HelpCircle className="w-4 h-4 text-surface-300 shrink-0" />;
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  evidenceId: string;
  fileType: string;
  fileName: string;
  initialValues: Partial<Evidence>;
  readonly?: boolean;
  onSave?: (updated: Partial<Evidence>) => void;
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function EvidenceChecklist({
  evidenceId,
  fileType,
  fileName,
  initialValues,
  readonly = false,
  onSave,
}: Props) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Partial<Evidence>>(initialValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const checks = getApplicableChecks(fileType);
  const status = computeStatus(values, fileType);

  const statusConfig = {
    valid: {
      label: "Válida",
      cls: "badge-green",
      icon: ShieldCheck,
      bar: "bg-green-500",
    },
    warning: {
      label: "Atenção",
      cls: "badge-amber",
      icon: AlertTriangle,
      bar: "bg-amber-400",
    },
    critical: {
      label: "Crítico",
      cls: "badge-red",
      icon: XCircle,
      bar: "bg-red-400",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  async function handleChange(field: CheckField, val: boolean) {
    const updated = { ...values, [field]: val };
    setValues(updated);

    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/evidences/${evidenceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", [field]: val }),
      });
      onSave?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-surface-200 rounded-lg overflow-hidden">
      {/* Cabeçalho — clicável para expandir */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "badge text-xs",
              statusConfig.cls
            )}
          >
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>
          <span className="text-xs text-surface-500 truncate max-w-[200px]">
            Checklist de validação
          </span>
          {saving && (
            <span className="text-xs text-brand-600 animate-pulse">
              Salvando...
            </span>
          )}
          {saved && (
            <span className="text-xs text-green-600">Salvo ✓</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-surface-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
        )}
      </button>

      {/* Barra de status */}
      <div className="h-0.5 bg-surface-200">
        <div
          className={cn(
            "h-full transition-all duration-500",
            statusConfig.bar
          )}
          style={{
            width: `${
              (checks.filter((c) => values[c.field] != null).length /
                Math.max(checks.length, 1)) *
              100
            }%`,
          }}
        />
      </div>

      {/* Checklist expandido */}
      {open && (
        <div className="divide-y divide-surface-100">
          {checks.map((check) => {
            const val = values[check.field];
            return (
              <div
                key={check.field}
                className={cn(
                  "px-4 py-3 flex items-start gap-3",
                  check.isCritical && val === false
                    ? "bg-red-50"
                    : "bg-white"
                )}
              >
                <AnswerIcon value={val} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-surface-800">
                      {check.label}
                    </p>
                    {check.isCritical && (
                      <span className="badge badge-red text-xs py-0">
                        Crítico
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">
                    {check.description}
                  </p>
                </div>

                {!readonly && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleChange(check.field, true)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                        val === true
                          ? "bg-green-600 text-white border-green-700"
                          : "bg-white text-surface-600 border-surface-300 hover:bg-green-50 hover:border-green-300"
                      )}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => handleChange(check.field, false)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                        val === false
                          ? "bg-red-500 text-white border-red-600"
                          : "bg-white text-surface-600 border-surface-300 hover:bg-red-50 hover:border-red-300"
                      )}
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Alertas no rodapé */}
          {status === "critical" && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-700">
                Esta evidência tem <strong>problemas críticos</strong> que
                precisam ser corrigidos antes do envio ao certame.
              </p>
            </div>
          )}
          {status === "warning" && (
            <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                Checklist incompleto. Complete as verificações para confirmar a
                validade desta evidência.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}