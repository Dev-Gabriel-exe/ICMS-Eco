// src/components/checklist/CriterionModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, FileText, Info, Loader2, ExternalLink, Upload,
  CheckCircle2, XCircle, Clock, Circle, AlertTriangle,
  Eye, Trash2, RefreshCw, ChevronRight, Plus,
} from "lucide-react";
import { calculateItemPoints } from "@/lib/scoring";
import { formatFileSize, getFileIcon, cn } from "@/lib/utils";
import { MAX_FILE_SIZE_BYTES } from "@/lib/r2";
import type { ChecklistItem, Criteria, CriteriaSubDoc, Evidence, ValidationStatus } from "@/types";

interface Props {
  criterion: Criteria;
  item?: ChecklistItem;
  municipalityId: string;
  certameId: string;
  population: number;
  onClose: () => void;
  onSaved: (item: ChecklistItem) => void;
}

type TabId = "documentos" | "pontuacao" | "requisito";
type SubDocStatus = "not_started" | "pending" | "approved" | "rejected";

function deriveSubDocStatus(evidences: Evidence[]): SubDocStatus {
  if (evidences.length === 0) return "not_started";
  if (evidences.some(e => e.validationStatus === "approved")) return "approved";
  if (evidences.some(e => e.validationStatus === "rejected")) return "rejected";
  return "pending";
}

const STATUS_CFG = {
  not_started: { label: "Não enviado",        icon: Circle,       cls: "bg-slate-100 text-slate-500 border-slate-200" },
  pending:     { label: "Aguardando análise", icon: Clock,        cls: "bg-amber-50 text-amber-700 border-amber-200"  },
  approved:    { label: "Aprovado",           icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected:    { label: "Reprovado",          icon: XCircle,      cls: "bg-red-50 text-red-700 border-red-200"        },
} as const;

function SubDocStatusBadge({ status }: { status: SubDocStatus }) {
  const cfg  = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0", cfg.cls)}>
      <Icon size={10} className="shrink-0" />{cfg.label}
    </span>
  );
}

function ValidationBadge({ status, comment }: { status: ValidationStatus; comment?: string | null }) {
  const cfg: Record<string, string> = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const label: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Reprovado" };
  return (
    <span title={comment ?? undefined}
      className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0", cfg[status] ?? cfg.pending)}>
      {label[status] ?? "Pendente"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FileRow — linha de arquivo individual
// ─────────────────────────────────────────────────────────────────────────────

function FileRow({ ev, onDelete }: { ev: Evidence; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Remover este arquivo?")) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/evidences/${ev.id}`, { method: "DELETE" });
      const d = await r.json();
      if (d.success) onDelete(ev.id);
      else alert(d.error ?? "Erro ao remover");
    } finally { setDeleting(false); }
  }

  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs group",
      ev.validationStatus === "approved" ? "bg-emerald-50/60 border-emerald-100" :
      ev.validationStatus === "rejected" ? "bg-red-50/60 border-red-100" :
      "bg-slate-50 border-slate-100"
    )}>
      <span className="text-base leading-none shrink-0">{getFileIcon(ev.fileType ?? null)}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-700 truncate">{ev.fileName}</p>
        <p className="text-slate-400 text-[10px] mt-0.5">
          {formatFileSize(ev.fileSizeBytes)}
          {ev.uploadedAt ? ` · ${new Date(ev.uploadedAt).toLocaleDateString("pt-BR")}` : ""}
        </p>
      </div>
      <ValidationBadge status={ev.validationStatus} comment={ev.reviewComment} />
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver arquivo"
          className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
          <Eye size={12} />
        </a>
        {ev.validationStatus !== "approved" && (
          <button type="button" onClick={handleDelete} disabled={deleting} title="Remover"
            className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UploadButton
// ─────────────────────────────────────────────────────────────────────────────

interface UploadButtonProps {
  onFile: (file: File) => Promise<void>;
  uploading: boolean;
  label?: string;
  multiple?: boolean;
  variant?: "primary" | "ghost" | "danger";
}

function UploadButton({ onFile, uploading, label = "Enviar arquivo", multiple = false, variant = "primary" }: UploadButtonProps) {
  const ref = useRef<HTMLInputElement>(null);

  const cls = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-sm",
    ghost:   "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-600 hover:text-brand-700",
    danger:  "bg-red-600 hover:bg-red-700 text-white shadow-sm",
  }[variant];

  return (
    <>
      <input ref={ref} type="file" hidden multiple={multiple}
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={async e => {
          const files = Array.from(e.target.files ?? []);
          for (const f of files) await onFile(f);
          if (ref.current) ref.current.value = "";
        }}
        disabled={uploading} />
      <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          cls
        )}>
        {uploading ? <><Loader2 size={12} className="animate-spin" />Enviando…</> : <><Upload size={12} />{label}</>}
      </button>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubDocCard
// ─────────────────────────────────────────────────────────────────────────────

interface SubDocCardProps {
  subDoc: CriteriaSubDoc;
  evidences: Evidence[];
  checklistItemId: string | undefined;
  criteriaId: string;
  municipalityId: string;
  certameId: string;
  onUploaded: (ev: Evidence) => void;
  onDeleted: (evId: string) => void;
}

function SubDocCard({ subDoc, evidences, checklistItemId, criteriaId, municipalityId, certameId, onUploaded, onDeleted }: SubDocCardProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState(false);

  const status     = deriveSubDocStatus(evidences);
  const isApproved = status === "approved";
  const canUpload  = !isApproved && (subDoc.acceptsMultiple || evidences.length === 0 || status === "rejected");

  async function handleFile(file: File) {
    setUploading(true); setError(null);
    try {
      // Usa a rota de upload via servidor (sem CORS)
      let itemId = checklistItemId;
      if (!itemId) {
        const chkRes = await fetch("/api/checklist", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipalityId, certameId, criteriaId, status: "in_progress" }),
        });
        itemId = (await chkRes.json()).data?.id;
      }
      if (!itemId) throw new Error("Não foi possível criar o item do checklist");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("municipalityId", municipalityId);
      formData.append("criteriaId", criteriaId);
      formData.append("checklistItemId", itemId);
      formData.append("subDocId", subDoc.id);

      const uploadRes  = await fetch("/api/evidences/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);
      onUploaded(uploadData.data as Evidence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally { setUploading(false); }
  }

  const borderCls =
    isApproved            ? "border-emerald-200 bg-emerald-50/20" :
    status === "rejected" ? "border-red-200 bg-red-50/10" :
    status === "pending"  ? "border-amber-200/80" :
    "border-slate-200";

  return (
    <div className={cn("rounded-xl border overflow-hidden transition-all duration-150", borderCls)}>
      {/* Header do sub-doc */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors">
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold",
          isApproved            ? "bg-emerald-100 text-emerald-600" :
          status === "rejected" ? "bg-red-100 text-red-600" :
          status === "pending"  ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
        )}>
          {isApproved ? <CheckCircle2 size={13} /> :
           status === "rejected" ? <XCircle size={13} /> :
           status === "pending"  ? <Clock size={13} /> : <Circle size={13} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{subDoc.label}</p>
          {subDoc.acceptsMultiple && (
            <span className="text-[10px] text-blue-600 font-medium">aceita múltiplos arquivos</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {evidences.length > 0 && (
            <span className="text-[11px] text-slate-400">{evidences.length} arq.</span>
          )}
          <SubDocStatusBadge status={status} />
        </div>
      </button>

      {/* Corpo expandido */}
      {expanded && (
        <div className="border-t border-slate-100/60">
          {subDoc.description && (
            <p className="px-4 pt-3 pb-2 text-xs text-slate-500 leading-relaxed bg-slate-50/50">
              {subDoc.description}
            </p>
          )}

          {/* Motivo de reprovação */}
          {status === "rejected" && evidences.some(e => e.reviewComment) && (
            <div className="mx-4 mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-red-700">Motivo da reprovação</p>
                {evidences.filter(e => e.validationStatus === "rejected" && e.reviewComment)
                  .map(e => <p key={e.id} className="text-[11px] text-red-600 mt-0.5">{e.reviewComment}</p>)}
              </div>
            </div>
          )}

          {/* Lista de arquivos */}
          {evidences.length > 0 && (
            <div className="px-4 py-3 flex flex-col gap-1.5">
              {evidences.map(ev => <FileRow key={ev.id} ev={ev} onDelete={onDeleted} />)}
            </div>
          )}

          {/* Upload */}
          {canUpload && (
            <div className={cn(
              "px-4 py-3 border-t flex items-center justify-between gap-3",
              status === "rejected"    ? "border-red-100 bg-red-50/30" :
              status === "not_started" ? "border-slate-100 bg-slate-50/30" :
              "border-amber-100 bg-amber-50/20"
            )}>
              <p className="text-[11px] text-slate-400">
                PDF, JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
              </p>
              <UploadButton
                onFile={handleFile}
                uploading={uploading}
                multiple={subDoc.acceptsMultiple}
                label={
                  status === "rejected" ? "Reenviar corrigido" :
                  status === "pending"  ? "Adicionar arquivo" :
                  "Enviar arquivo"
                }
                variant={status === "rejected" ? "danger" : status === "pending" ? "ghost" : "primary"}
              />
            </div>
          )}

          {error && (
            <div className="mx-4 mb-3 flex items-center gap-1.5 text-xs text-red-600">
              <AlertTriangle size={11} />{error}
            </div>
          )}

          {isApproved && (
            <div className="px-4 py-2.5 border-t border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700 font-medium">Aprovado pela equipe SEMARH</p>
            </div>
          )}
        </div>
      )}

      {/* Se não expandido, mostra botão de upload rápido quando não enviou nada ainda */}
      {!expanded && canUpload && evidences.length === 0 && (
        <div className="px-4 pb-3 flex justify-end">
          <UploadButton onFile={handleFile} uploading={uploading} label="Enviar" variant="primary" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GenericUploader (para critérios sem sub-docs)
// ─────────────────────────────────────────────────────────────────────────────

function GenericUploader({ evidences, checklistItemId, criteriaId, municipalityId, certameId, onUploaded, onDeleted }:
  { evidences: Evidence[]; checklistItemId: string | undefined; criteriaId: string; municipalityId: string; certameId: string; onUploaded: (ev: Evidence) => void; onDeleted: (evId: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isDrag, setIsDrag]       = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true); setError(null);
    try {
      let itemId = checklistItemId;
      if (!itemId) {
        const chk = await fetch("/api/checklist", {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipalityId, certameId, criteriaId, status: "in_progress" }),
        });
        itemId = (await chk.json()).data?.id;
      }
      if (!itemId) throw new Error("Não foi possível criar o item");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("municipalityId", municipalityId);
      formData.append("criteriaId", criteriaId);
      formData.append("checklistItemId", itemId);

      const res  = await fetch("/api/evidences/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onUploaded(data.data as Evidence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  }

  return (
    <div className="space-y-3">
      {evidences.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {evidences.map(ev => <FileRow key={ev.id} ev={ev} onDelete={onDeleted} />)}
        </div>
      )}

      <input ref={ref} type="file" hidden multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        onChange={async e => {
          for (const f of Array.from(e.target.files ?? [])) await handleFile(f);
          if (ref.current) ref.current.value = "";
        }}
        disabled={uploading} />

      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={e => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150 select-none",
          isDrag ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-brand-300 hover:bg-slate-50/50"
        )}
      >
        {uploading
          ? <Loader2 size={18} className="animate-spin text-brand-500 mx-auto mb-2" />
          : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-2">
              <Upload size={15} className="text-slate-500" />
            </div>
        }
        <p className="text-sm font-medium text-slate-600">
          {uploading ? "Enviando…" : isDrag ? "Solte aqui" : "Arraste arquivos ou clique para selecionar"}
        </p>
        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB · múltiplos arquivos</p>
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={11} />{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CriterionModal
// ─────────────────────────────────────────────────────────────────────────────

export default function CriterionModal({ criterion, item, municipalityId, certameId, population, onClose, onSaved }: Props) {
  const [status, setStatus]       = useState<ChecklistItem["status"]>(item?.status ?? "not_started");
  const [quantity, setQuantity]   = useState<number | null>(item?.quantity ?? null);
  const [pct, setPct]             = useState<number | null>(item?.percentageValue != null ? Number(item.percentageValue) : null);
  const [faixaLevel, setFaixa]    = useState<number | null>(item?.faixaLevel ?? null);
  const [mapLink, setMapLink]     = useState(item?.mapLink ?? "");
  const [notes, setNotes]         = useState(item?.notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [evidences, setEvidences] = useState<Evidence[]>((item?.evidences ?? []) as Evidence[]);
  const [loadingEvs, setLoadingEvs] = useState(false);

  const hasSubDocs = (criterion.subDocs?.length ?? 0) > 0;
  const [tab, setTab] = useState<TabId>("documentos");

  const pendingDocsCount = hasSubDocs
    ? (criterion.subDocs ?? []).filter(sd =>
        deriveSubDocStatus(evidences.filter(e => e.subDocId === sd.id)) === "not_started" ||
        deriveSubDocStatus(evidences.filter(e => e.subDocId === sd.id)) === "rejected"
      ).length
    : 0;

  const fakeItem = { status, quantity, percentageValue: pct, faixaLevel } as unknown as ChecklistItem;
  const points   = calculateItemPoints(fakeItem, criterion, population);

  const fetchEvidences = useCallback(async () => {
    if (!item?.id) return;
    setLoadingEvs(true);
    try {
      const res  = await fetch(`/api/evidences?checklistItemId=${item.id}`);
      const data = await res.json();
      if (data.success) setEvidences(data.data ?? []);
    } catch { /* silencioso */ }
    finally { setLoadingEvs(false); }
  }, [item?.id]);

  useEffect(() => { fetchEvidences(); }, [fetchEvidences]);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, []); // eslint-disable-line

  async function handleSave() {
    setSaving(true);
    const res  = await fetch("/api/checklist", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ municipalityId, certameId, criteriaId: criterion.id, status, quantity, percentageValue: pct, faixaLevel, mapLink: mapLink || null, notes: notes || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) { setJustSaved(true); setTimeout(() => setJustSaved(false), 2000); onSaved(data.data as ChecklistItem); }
  }

  function handleUploaded(ev: Evidence) { setEvidences(prev => [...prev.filter(e => e.id !== ev.id), ev]); }
  function handleDeleted(evId: string)  { setEvidences(prev => prev.filter(e => e.id !== evId)); }

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "documentos", label: "Documentos", badge: pendingDocsCount > 0 ? pendingDocsCount : undefined },
    { id: "pontuacao",  label: "Pontuação" },
    { id: "requisito",  label: "Requisito" },
  ];

  // Progresso dos sub-docs
  const subDocProgress = hasSubDocs ? (() => {
    const total    = criterion.subDocs!.length;
    const sent     = criterion.subDocs!.filter(sd => deriveSubDocStatus(evidences.filter(e => e.subDocId === sd.id)) !== "not_started").length;
    const approved = criterion.subDocs!.filter(sd => deriveSubDocStatus(evidences.filter(e => e.subDocId === sd.id)) === "approved").length;
    return { total, sent, approved };
  })() : null;

  if (!mounted) return null;

  return createPortal((
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4">
        <div
          onClick={e => e.stopPropagation()}
          className="pointer-events-auto bg-white w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl"
          style={{ animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {/* ── Header ── */}
          <div className="flex items-start gap-3 px-5 pt-4 pb-3.5 border-b border-slate-100 shrink-0">
            {/* Handle mobile */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-200 sm:hidden" />

            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5",
              status === "complete"    ? "bg-emerald-600" :
              status === "in_progress" ? "bg-amber-500" : "bg-slate-600"
            )}>
              {criterion.id}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-sm leading-tight">{criterion.description}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{criterion.axisName}</p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="text-right">
                <div className={cn("text-base font-bold tabular-nums leading-tight", points > 0 ? "text-brand-700" : "text-slate-400")}>
                  {points}<span className="text-xs font-normal text-slate-400"> / {criterion.maxPoints} pts</span>
                </div>
              </div>
              <button type="button" onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-slate-100 shrink-0 px-2">
            {tabs.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors",
                  tab === t.id
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-slate-500 hover:text-slate-700"
                )}>
                {t.label}
                {t.badge !== undefined && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Body (scroll aqui) ── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* ── TAB DOCUMENTOS ── */}
            {tab === "documentos" && (
              <div className="px-5 py-4 space-y-3">
                {loadingEvs ? (
                  <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Carregando arquivos…</span>
                  </div>
                ) : hasSubDocs ? (
                  <>
                    {/* Barra de progresso */}
                    {subDocProgress && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-slate-600">Documentos enviados</span>
                            <span className="text-xs font-bold text-brand-700">{subDocProgress.sent} / {subDocProgress.total}</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${subDocProgress.total > 0 ? Math.round((subDocProgress.sent / subDocProgress.total) * 100) : 0}%` }} />
                          </div>
                        </div>
                        {subDocProgress.approved > 0 && (
                          <div className="text-center shrink-0">
                            <div className="text-lg font-bold text-emerald-700">{subDocProgress.approved}</div>
                            <div className="text-[10px] text-emerald-600 font-medium">aprovados</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-docs — abre expandido o primeiro pendente */}
                    {[...(criterion.subDocs ?? [])].sort((a, b) => a.order - b.order).map(sd => (
                      <SubDocCard key={sd.id} subDoc={sd}
                        evidences={evidences.filter(e => e.subDocId === sd.id)}
                        checklistItemId={item?.id} criteriaId={criterion.id}
                        municipalityId={municipalityId} certameId={certameId}
                        onUploaded={handleUploaded} onDeleted={handleDeleted} />
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        Envie os arquivos manualmente conforme a documentação exigida na aba <strong>Requisito</strong>.
                      </p>
                    </div>
                    <GenericUploader evidences={evidences} checklistItemId={item?.id}
                      criteriaId={criterion.id} municipalityId={municipalityId} certameId={certameId}
                      onUploaded={handleUploaded} onDeleted={handleDeleted} />
                  </>
                )}
              </div>
            )}

            {/* ── TAB PONTUAÇÃO ── */}
            {tab === "pontuacao" && (
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="label">Status do critério</label>
                  <select value={status} onChange={e => setStatus(e.target.value as ChecklistItem["status"])} className="input">
                    <option value="not_started">Não iniciado</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="complete">Completo</option>
                  </select>
                </div>

                {criterion.scoringType === "per_unit" && (
                  <div>
                    <label className="label">Quantidade</label>
                    <input type="number" min={0} className="input" placeholder="Número de unidades"
                      value={quantity ?? ""} onChange={e => setQuantity(e.target.value ? Number(e.target.value) : null)} />
                    {criterion.scoringConfig && "unitValue" in criterion.scoringConfig && (
                      <p className="text-xs text-slate-400 mt-1">
                        {(criterion.scoringConfig as { unitValue: number }).unitValue} pts/unidade · máx {criterion.maxPoints} pts
                      </p>
                    )}
                  </div>
                )}

                {criterion.scoringType === "percentage" && (
                  <div>
                    <label className="label">Cobertura de esgotamento (%)</label>
                    <input type="number" min={0} max={100} step={0.1} className="input" placeholder="Ex: 75.5"
                      value={pct ?? ""} onChange={e => setPct(e.target.value ? Number(e.target.value) : null)} />
                    <p className="text-xs text-slate-400 mt-1">
                      Fórmula: % × 0,15 · máx {criterion.maxPoints} pts
                      {pct ? ` → estimado: ${Math.min(Number((pct * 0.15).toFixed(1)), criterion.maxPoints)} pts` : ""}
                    </p>
                  </div>
                )}

                {criterion.scoringType === "per_faixa" &&
                 criterion.scoringConfig && "type" in criterion.scoringConfig &&
                 (criterion.scoringConfig as { type: string }).type === "territory" && (
                  <div>
                    <label className="label">Percentual do território com UC (%)</label>
                    <input type="number" min={0} max={100} step={0.1} className="input" placeholder="Ex: 30"
                      value={pct ?? ""} onChange={e => setPct(e.target.value ? Number(e.target.value) : null)} />
                  </div>
                )}

                {criterion.scoringType === "per_faixa" &&
                 criterion.scoringConfig && "type" in criterion.scoringConfig &&
                 (criterion.scoringConfig as { type: string }).type === "population" && (
                  <div>
                    <label className="label">Nível comprovado de mudas plantadas</label>
                    <select value={faixaLevel ?? ""} onChange={e => setFaixa(e.target.value ? Number(e.target.value) : null)} className="input">
                      <option value="">Selecione o nível atingido</option>
                      <option value="1">Nível 1 — 8 pts</option>
                      <option value="2">Nível 2 — 12 pts</option>
                      <option value="3">Nível 3 — 30 pts (máximo)</option>
                    </select>
                    <p className="text-xs text-slate-400 mt-1">Consulte a tabela C.5 no decreto.</p>
                  </div>
                )}

                {criterion.hasMapLink && (
                  <div>
                    <label className="label flex items-center gap-1.5">
                      Link do relatório SEMARH <ExternalLink size={11} className="text-slate-400" />
                    </label>
                    <input type="url" className="input" placeholder="https://..."
                      value={mapLink} onChange={e => setMapLink(e.target.value)} />
                    <p className="text-xs text-slate-400 mt-1">URL do Relatório Técnico de Redução de Desmatamento Ilegal (SEMARH)</p>
                  </div>
                )}

                <div>
                  <label className="label">Observações internas</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    rows={3} className="input resize-none"
                    placeholder="Pendências, contatos, referências de certames anteriores..." />
                </div>

                {/* Pontos estimados */}
                <div className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border",
                  points > 0 ? "bg-brand-50 border-brand-200" : "bg-slate-50 border-slate-200"
                )}>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Pontos estimados</p>
                    <p className="text-[11px] text-slate-400">com os dados informados acima</p>
                  </div>
                  <span className={cn("text-2xl font-bold tabular-nums", points > 0 ? "text-brand-700" : "text-slate-400")}>
                    {points} <span className="text-sm font-normal text-slate-400">pts</span>
                  </span>
                </div>
              </div>
            )}

            {/* ── TAB REQUISITO ── */}
            {tab === "requisito" && (
              <div className="px-5 py-4 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Requisito — Decreto 24.288/2025</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{criterion.requirement}</p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <FileText size={11} /> Documentação comprobatória exigida
                  </p>
                  <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{criterion.requiredDocs}</p>
                </div>

                <div className="flex flex-col gap-2">
                  {criterion.isReusable && (
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <Info size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">Documento permanente (Art. 17)</p>
                        <p className="text-xs text-emerald-700 mt-0.5">Pode ser comprovado com documento de certame anterior. Informe a referência e o ano em que foi aceito.</p>
                      </div>
                    </div>
                  )}
                  {criterion.validYears === 3 && (
                    <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Validade especial — 3 anos (Art. 16 §3°)</p>
                        <p className="text-xs text-amber-700 mt-0.5">Os relatórios deste item podem ser aproveitados por até 3 anos.</p>
                      </div>
                    </div>
                  )}
                  {criterion.hasMapLink && (
                    <div className="flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                      <ExternalLink size={13} className="text-purple-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-800">Este item exige o link do relatório técnico da SEMARH na aba "Pontuação".</p>
                    </div>
                  )}
                </div>

                {hasSubDocs && (
                  <button type="button" onClick={() => setTab("documentos")}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-sm font-medium">
                    <span>Ir para upload dos documentos</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Footer fixo com botão salvar ── */}
          <div className="px-5 py-3.5 border-t border-slate-100 shrink-0 flex items-center gap-3 bg-white">
            <button onClick={handleSave} disabled={saving}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all",
                justSaved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-brand-600 hover:bg-brand-700",
                saving && "opacity-60 cursor-not-allowed"
              )}>
              {saving     ? <><Loader2 size={14} className="animate-spin" />Salvando…</>
              : justSaved ? <><CheckCircle2 size={14} />Salvo!</>
              :              "Salvar pontuação"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 639px) {
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(100%); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }
      `}</style>
    </>
  ), document.body);
}