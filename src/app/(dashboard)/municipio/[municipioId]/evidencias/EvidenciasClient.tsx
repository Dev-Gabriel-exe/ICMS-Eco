// src/app/(dashboard)/municipio/[municipioId]/evidencias/EvidenciasClient.tsx
"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, Clock, Circle, ChevronRight,
  ChevronDown, ChevronUp, Eye, Trash2, Loader2,
  AlertTriangle, FileText, Upload, RefreshCw, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "@/lib/utils";

// ─── Tipos ─────────────────────────────────────────────────────────────────

type ValidationStatus = "pending" | "approved" | "rejected";

interface EvidenceItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSizeBytes: number | null;
  uploadedAt: string;
  validationStatus: ValidationStatus;
  reviewComment: string | null;
  validatedAt: string | null;
  subDocId: string | null;
  uploader:  { id: string; name: string; email: string };
  validator: { id: string; name: string } | null;
  subDoc:    { id: string; label: string; code: string } | null;
}

interface SubDocItem {
  id: string;
  code: string;
  label: string;
  description: string;
  acceptsMultiple: boolean;
  order: number;
}

interface ChecklistItemData {
  id: string;
  criteriaId: string;
  criteria: {
    id: string;
    axis: string;
    axisName: string;
    description: string;
    subDocs: SubDocItem[];
  };
  evidences: EvidenceItem[];
}

interface Props {
  municipioId: string;
  items: ChecklistItemData[];
  canReview: boolean;
  canDeleteEvidence: boolean;
  initialFilter?: "all" | "pending" | "approved" | "rejected";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const AXES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

function getAxisStatus(items: ChecklistItemData[]): "empty" | "pending" | "rejected" | "approved" {
  const evs = items.flatMap(i => i.evidences);
  if (evs.length === 0) return "empty";
  if (evs.some(e => e.validationStatus === "rejected")) return "rejected";
  if (evs.some(e => e.validationStatus === "pending"))  return "pending";
  return "approved";
}

function getCriterionStatus(evs: EvidenceItem[]): "empty" | "pending" | "rejected" | "approved" {
  if (evs.length === 0) return "empty";
  if (evs.some(e => e.validationStatus === "rejected")) return "rejected";
  if (evs.some(e => e.validationStatus === "pending"))  return "pending";
  return "approved";
}

const STATUS_CFG = {
  empty:    { icon: Circle,       cls: "text-slate-300",   badge: "bg-slate-100 text-slate-400 border-slate-200",   label: "Sem arquivos" },
  pending:  { icon: Clock,        cls: "text-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",    label: "Pendente"     },
  rejected: { icon: XCircle,      cls: "text-red-400",     badge: "bg-red-50 text-red-700 border-red-200",          label: "Rejeitado"    },
  approved: { icon: CheckCircle2, cls: "text-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Aprovado"  },
} as const;

// ─── Modal de revisão (admin) ───────────────────────────────────────────────

function ReviewModal({
  ev, action, onClose, onDone,
}: {
  ev: EvidenceItem;
  action: "approve" | "reject";
  onClose: () => void;
  onDone: (evId: string, status: ValidationStatus, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const isReject = action === "reject";

  async function submit() {
    if (isReject && !comment.trim()) { setError("Informe o motivo da rejeição."); return; }
    if (!isReject && !allCriticalOk) {
      setError("Marque todos os itens obrigatórios como 'Sim' antes de aprovar.");
      return;
    }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/evidences/${ev.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment.trim() || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Erro ao salvar");
      onDone(ev.id, isReject ? "rejected" : "approved", comment.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  }

  // Checklist técnico local
  const isImage = ev.fileType?.startsWith("image/") ?? false;
  const isPdf   = ev.fileType === "application/pdf";

  const checklistFields = [
    { key: "hasDate",                label: "Possui data visível",                       critical: true,  show: true      },
    { key: "dateIsInPeriod",         label: "Data dentro do período de apuração",        critical: true,  show: true      },
    { key: "isOriginalDoc",          label: "Documento original (não reutilizado)",       critical: true,  show: true      },
    { key: "hasGeotag",              label: "Possui georreferenciamento (geotag)",        critical: false, show: isImage   },
    { key: "isPdfSearchable",        label: "PDF pesquisável (não é scan)",               critical: false, show: isPdf     },
    { key: "hasElectronicSignature", label: "Assinatura eletrônica verificável (art. 16)", critical: false, show: isPdf   },
    { key: "followsAnnexII",         label: "Segue modelo Relatório Operacional (Anexo II)", critical: false, show: isPdf },
  ] as const;

  type CheckKey = typeof checklistFields[number]["key"];
  const [checks, setChecks] = useState<Record<CheckKey, boolean | null>>({
    hasDate: null, dateIsInPeriod: null, isOriginalDoc: null,
    hasGeotag: null, isPdfSearchable: null, hasElectronicSignature: null, followsAnnexII: null,
  });

  const visibleChecks = checklistFields.filter(f => f.show);
  const criticalChecks = visibleChecks.filter(f => f.critical);
  const criticalFails = criticalChecks.filter(f => checks[f.key] === false);
  const allCriticalOk = criticalChecks.every(f => checks[f.key] === true);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col rounded-t-2xl max-h-[92dvh]"
        style={{ animation: "fadeIn 0.18s ease both" }}>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            isReject ? "bg-red-100" : "bg-emerald-100")}>
            {isReject ? <XCircle size={18} className="text-red-600" /> : <CheckCircle2 size={18} className="text-emerald-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn("text-base font-bold", isReject ? "text-red-700" : "text-emerald-700")}>
              {isReject ? "Rejeitar arquivo" : "Aprovar arquivo"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{ev.fileName}</p>
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0">
            <XCircle size={15} />
          </button>
        </div>

        {/* Body scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Preview do arquivo */}
          <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:bg-slate-100 transition-colors">
            <span className="text-xl">{getFileIcon(ev.fileType)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{ev.fileName}</p>
              <p className="text-[11px] text-slate-400">{formatFileSize(ev.fileSizeBytes)} · {ev.uploader.name}</p>
            </div>
            <Eye size={13} className="text-slate-400 shrink-0" />
          </a>

          {/* Checklist técnico do edital */}
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={11} className="text-brand-500" />
              Checklist técnico — Decreto 24.288/2025
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {visibleChecks.map(f => (
                <div key={f.key} className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  checks[f.key] === false && f.critical ? "bg-red-50" :
                  checks[f.key] === true ? "bg-emerald-50/40" : "bg-white"
                )}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 leading-tight">{f.label}</p>
                    {f.critical && (
                      <span className="text-[10px] text-red-500 font-semibold">Obrigatório</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(["true", "false"] as const).map(val => (
                      <button key={val} type="button"
                        onClick={() => setChecks(prev => ({ ...prev, [f.key]: val === "true" }))}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all",
                          val === "true"
                            ? checks[f.key] === true  ? "bg-emerald-600 text-white border-emerald-700" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
                            : checks[f.key] === false ? "bg-red-500 text-white border-red-600"         : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-600"
                        )}>
                        {val === "true" ? "Sim" : "Não"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Alerta crítico */}
            {criticalFails.length > 0 && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700">
                  <strong>{criticalFails.length} item{criticalFails.length > 1 ? "s" : ""} obrigatório{criticalFails.length > 1 ? "s" : ""} reprovado{criticalFails.length > 1 ? "s" : ""}.</strong>{" "}
                  Recomenda-se rejeitar esta evidência.
                </p>
              </div>
            )}
          </div>

          {/* Comentário */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
              {isReject ? "Motivo da rejeição *" : "Comentário (opcional)"}
            </label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
              placeholder={isReject
                ? "Ex: A foto não possui georreferenciamento exigido pelo edital (art. 16 §1°)..."
                : "Observação opcional para o funcionário..."}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 resize-none placeholder:text-slate-400" />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={12} />{error}
            </p>
          )}
        </div>

        {/* Footer fixo */}
        <div className="px-5 py-3.5 border-t border-slate-100 shrink-0 flex gap-2 bg-white">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || (!isReject && !allCriticalOk)}
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50",
              isReject ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}>
            {loading ? <><Loader2 size={13} className="animate-spin" />Salvando…</>
              : isReject ? <><XCircle size={13} />Rejeitar</> : <><CheckCircle2 size={13} />Aprovar</>}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(20px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}

// ─── Linha de arquivo ────────────────────────────────────────────────────────

function FileRow({
  ev, canReview, canDeleteEvidence,
  onReview, onDelete,
}: {
  ev: EvidenceItem;
  canReview: boolean;
  canDeleteEvidence: boolean;
  onReview: (ev: EvidenceItem, action: "approve" | "reject") => void;
  onDelete: (evId: string) => void;
}) {
  const [deleting, setDeleting]   = useState(false);
  const [imgError, setImgError]   = useState(false);
  const cfg  = STATUS_CFG[ev.validationStatus];
  const Icon = cfg.icon;

  const isImage = ev.fileType?.startsWith("image/") ?? false;
  const isPdf   = ev.fileType === "application/pdf";

  const downloadHref = `/api/files/download?url=${encodeURIComponent(ev.fileUrl)}&name=${encodeURIComponent(ev.fileName)}`;

  async function handleDelete() {
    if (!confirm(`Excluir "${ev.fileName}"?`)) return;
    setDeleting(true);
    try {
      const res  = await fetch(`/api/evidences/${ev.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onDelete(ev.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    } finally { setDeleting(false); }
  }

  const canDelete = canDeleteEvidence || ev.validationStatus === "pending";

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden group transition-all",
      ev.validationStatus === "approved" ? "border-emerald-200 bg-emerald-50/20" :
      ev.validationStatus === "rejected" ? "border-red-200 bg-red-50/20" :
      "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
    )}>
      <div className="flex gap-0">

        {/* ── Preview lateral ── */}
        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer"
          className="shrink-0 relative overflow-hidden"
          style={{ width: 96, minHeight: 80 }}>
          {isImage && !imgError ? (
            <>
              <img
                src={ev.fileUrl}
                alt={ev.fileName}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
                style={{ minHeight: 80, maxHeight: 120 }}
              />
              {/* overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            </>
          ) : isPdf ? (
            <div className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-1 px-2",
              ev.validationStatus === "approved" ? "bg-emerald-100/60" :
              ev.validationStatus === "rejected" ? "bg-red-100/60" :
              "bg-slate-100"
            )}>
              <span className="text-3xl select-none">📄</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide text-center">PDF</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <span className="text-2xl">{getFileIcon(ev.fileType)}</span>
            </div>
          )}

          {/* Badge de status sobre o preview */}
          <div className="absolute top-1.5 left-1.5">
            <span className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded-full border shadow-sm",
              ev.validationStatus === "approved" ? "bg-emerald-500 border-emerald-600" :
              ev.validationStatus === "rejected" ? "bg-red-500 border-red-600" :
              "bg-amber-400 border-amber-500"
            )}>
              <Icon size={10} className="text-white" />
            </span>
          </div>
        </a>

        {/* ── Metadados + ações ── */}
        <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2">
              <p className="text-sm font-semibold text-slate-800 leading-tight flex-1 min-w-0 line-clamp-2">
                {ev.fileName}
              </p>
              {/* Ações — sempre visíveis no mobile, hover no desktop */}
              <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" title="Abrir"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                  <Eye size={13} />
                </a>
                <a href={downloadHref} title="Baixar" download={ev.fileName}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                  <Download size={13} />
                </a>
                {canReview && ev.validationStatus !== "approved" && (
                  <button type="button" title="Aprovar" onClick={() => onReview(ev, "approve")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <CheckCircle2 size={13} />
                  </button>
                )}
                {canReview && ev.validationStatus !== "rejected" && (
                  <button type="button" title="Rejeitar" onClick={() => onReview(ev, "reject")}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <XCircle size={13} />
                  </button>
                )}
                {canDelete && (
                  <button type="button" title="Excluir" onClick={handleDelete} disabled={deleting}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                )}
              </div>
            </div>

            {ev.subDoc && (
              <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600 font-medium">
                {ev.subDoc.label}
              </span>
            )}
          </div>

          <div className="mt-1.5 space-y-1">
            <p className="text-[11px] text-slate-400 leading-tight">
              {formatFileSize(ev.fileSizeBytes)} · {ev.uploader.name}<br />
              {new Date(ev.uploadedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
            </p>

            {ev.reviewComment && (
              <div className="flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5">
                <AlertTriangle size={10} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-red-700 line-clamp-2">{ev.reviewComment}</p>
              </div>
            )}

            {ev.validator && ev.validatedAt && (
              <p className="text-[10px] text-slate-400">
                {ev.validationStatus === "approved" ? "✓" : "✗"} {ev.validator.name} · {new Date(ev.validatedAt).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Barra de ação rápida para admin em mobile (sempre visível) */}
      {canReview && ev.validationStatus === "pending" && (
        <div className="flex border-t border-slate-100 sm:hidden">
          <button type="button" onClick={() => onReview(ev, "approve")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors">
            <CheckCircle2 size={13} />Aprovar
          </button>
          <div className="w-px bg-slate-200" />
          <button type="button" onClick={() => onReview(ev, "reject")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
            <XCircle size={13} />Rejeitar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Card de critério ────────────────────────────────────────────────────────

function CriterionCard({
  item, canReview, canDeleteEvidence, onReview, onDelete,
}: {
  item: ChecklistItemData;
  canReview: boolean;
  canDeleteEvidence: boolean;
  onReview: (ev: EvidenceItem, action: "approve" | "reject") => void;
  onDelete: (itemId: string, evId: string) => void;
}) {
  const status  = getCriterionStatus(item.evidences);
  const cfg     = STATUS_CFG[status];
  const Icon    = cfg.icon;
  const pending = item.evidences.filter(e => e.validationStatus === "pending").length;

  const [open, setOpen] = useState(pending > 0);

  if (item.evidences.length === 0) return null;

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden transition-all",
      status === "rejected" ? "border-red-200" :
      status === "pending"  ? "border-amber-200/80" :
      status === "approved" ? "border-emerald-200" :
      "border-slate-200"
    )}>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors bg-white">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
          status === "approved" ? "bg-emerald-100 text-emerald-700" :
          status === "rejected" ? "bg-red-100 text-red-700" :
          status === "pending"  ? "bg-amber-100 text-amber-700" :
          "bg-slate-100 text-slate-500"
        )}>
          {item.criteria.id}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{item.criteria.description}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{item.evidences.length} arquivo{item.evidences.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              <Clock size={9} />{pending} pendente{pending > 1 ? "s" : ""}
            </span>
          )}
          <span className={cn("inline-flex items-center gap-1", cfg.cls)}>
            <Icon size={14} />
          </span>
          {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 flex flex-col gap-2 bg-slate-50/30">
          {item.evidences.map(ev => (
            <FileRow
              key={ev.id}
              ev={ev}
              canReview={canReview}
              canDeleteEvidence={canDeleteEvidence}
              onReview={onReview}
              onDelete={evId => onDelete(item.id, evId)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de eixo ────────────────────────────────────────────────────────────

function AxisCard({
  axis, axisName, items, canReview, canDeleteEvidence, onReview, onDelete,
}: {
  axis: string;
  axisName: string;
  items: ChecklistItemData[];
  canReview: boolean;
  canDeleteEvidence: boolean;
  onReview: (ev: EvidenceItem, action: "approve" | "reject") => void;
  onDelete: (itemId: string, evId: string) => void;
}) {
  const status  = getAxisStatus(items);
  const cfg     = STATUS_CFG[status];
  const Icon    = cfg.icon;
  const totalEv = items.reduce((a, i) => a + i.evidences.length, 0);
  const pending = items.reduce((a, i) => a + i.evidences.filter(e => e.validationStatus === "pending").length, 0);

  const [open, setOpen] = useState(status === "pending" || status === "rejected");

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all shadow-sm",
      status === "rejected" ? "border-red-200 bg-red-50/10" :
      status === "pending"  ? "border-amber-200 bg-amber-50/10" :
      status === "approved" ? "border-emerald-200 bg-emerald-50/10" :
      "border-slate-200 bg-white"
    )}>
      {/* Header do eixo */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
          status === "approved" ? "bg-emerald-600 text-white" :
          status === "rejected" ? "bg-red-500 text-white" :
          status === "pending"  ? "bg-amber-500 text-white" :
          "bg-slate-200 text-slate-600"
        )}>
          {axis}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">{axisName}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {items.length} critério{items.length !== 1 ? "s" : ""} · {totalEv} arquivo{totalEv !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              <Clock size={10} />{pending} pendente{pending > 1 ? "s" : ""}
            </span>
          )}
          <Icon size={16} className={cfg.cls} />
          {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* Critérios */}
      {open && (
        <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-2">
          {items.map(item => (
            <CriterionCard
              key={item.id}
              item={item}
              canReview={canReview}
              canDeleteEvidence={canDeleteEvidence}
              onReview={onReview} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function EvidenciasClient({
  municipioId,
  items: initialItems,
  canReview,
  canDeleteEvidence,
  initialFilter = "all",
}: Props) {
  const [items, setItems]     = useState<ChecklistItemData[]>(initialItems);
  const [reviewing, setReviewing] = useState<{ ev: EvidenceItem; action: "approve" | "reject" } | null>(null);
  const [filter, setFilter]   = useState<"all" | "pending" | "approved" | "rejected">(initialFilter);

  function handleReviewDone(evId: string, status: ValidationStatus, comment: string) {
    setItems(prev => prev.map(item => ({
      ...item,
      evidences: item.evidences.map(ev =>
        ev.id === evId ? { ...ev, validationStatus: status, reviewComment: comment || null } : ev
      ),
    })));
  }

  function handleDelete(itemId: string, evId: string) {
    setItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, evidences: item.evidences.filter(e => e.id !== evId) }
        : item
    ).filter(item => item.evidences.length > 0));
  }

  // Filtra items por status se necessário
  const filteredItems = filter === "all"
    ? items
    : items.map(item => ({
        ...item,
        evidences: item.evidences.filter(e => e.validationStatus === filter),
      })).filter(item => item.evidences.length > 0);

  // Agrupa por eixo
  const byAxis = AXES.map(axis => {
    const axisItems = filteredItems.filter(i => i.criteria.axis === axis);
    if (axisItems.length === 0) return null;
    return {
      axis,
      axisName: axisItems[0].criteria.axisName,
      items: axisItems,
    };
  }).filter(Boolean) as { axis: string; axisName: string; items: ChecklistItemData[] }[];

  // Stats
  const allEvs    = items.flatMap(i => i.evidences);
  const stats = {
    total:    allEvs.length,
    pending:  allEvs.filter(e => e.validationStatus === "pending").length,
    approved: allEvs.filter(e => e.validationStatus === "approved").length,
    rejected: allEvs.filter(e => e.validationStatus === "rejected").length,
  };

  return (
    <>
      {reviewing && (
        <ReviewModal ev={reviewing.ev} action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={handleReviewDone} />
      )}

      <div className="flex flex-col gap-5">
        {/* Stats / filtros */}
        <div className="grid grid-cols-4 gap-3" style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "80ms" }}>
          {[
            { label: "Total",      value: stats.total,    color: "text-slate-700",    bg: "bg-white border-slate-200",         f: "all"      },
            { label: "Pendentes",  value: stats.pending,  color: "text-amber-700",    bg: "bg-amber-50 border-amber-200",      f: "pending"  },
            { label: "Aprovados",  value: stats.approved, color: "text-emerald-700",  bg: "bg-emerald-50 border-emerald-200",  f: "approved" },
            { label: "Rejeitados", value: stats.rejected, color: "text-red-700",      bg: "bg-red-50 border-red-200",          f: "rejected" },
          ].map(s => (
            <button key={s.f} type="button" onClick={() => setFilter(s.f as typeof filter)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-center transition-all hover:-translate-y-0.5",
                s.bg,
                filter === s.f && "ring-2 ring-brand-400 ring-offset-1 shadow-sm"
              )}>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Lista por eixo */}
        {byAxis.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 flex flex-col items-center gap-3"
            style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "100ms" }}>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <FileText size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              {filter === "all"
                ? "Nenhuma evidência enviada ainda. Acesse o checklist de cada eixo para enviar."
                : `Nenhuma evidência ${filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : "rejeitada"}.`}
            </p>
            {filter !== "all" && (
              <button type="button" onClick={() => setFilter("all")}
                className="text-xs text-brand-600 hover:underline">Ver todas</button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {byAxis.map((group, i) => (
              <div key={group.axis} style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${120 + i * 40}ms` }}>
                <AxisCard
                  axis={group.axis}
                  axisName={group.axisName}
                  items={group.items}
                  canReview={canReview}
                  canDeleteEvidence={canDeleteEvidence}
                  onReview={(ev, action) => setReviewing({ ev, action })}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
