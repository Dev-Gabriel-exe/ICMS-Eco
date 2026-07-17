// src/components/checklist/CriterionModal.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, FileText, Info, Loader2, ExternalLink, Upload,
  CheckCircle2, XCircle, Clock, Circle, AlertTriangle,
  Eye, Download, Trash2, RefreshCw, ChevronRight,
} from "lucide-react";
import { calculateItemPoints } from "@/lib/scoring";
import { formatFileSize, getFileIcon, cn } from "@/lib/utils";
import { MAX_FILE_SIZE_BYTES } from "@/lib/r2";
import type { ChecklistItem, Criteria, CriteriaSubDoc, Evidence, EvidenceKind, ValidationStatus } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  criterion: Criteria;
  item?: ChecklistItem;
  municipalityId: string;
  certameId: string;
  population: number;
  onClose: () => void;
  onSaved: (item: ChecklistItem) => void;
}

type TabId = "pontuacao" | "documentos" | "evidencias" | "requisito";
type SubDocStatus = "not_started" | "pending" | "approved" | "rejected";

function isScoringDoc(e: Evidence) {
  return (e.kind ?? "document") === "document";
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deriveSubDocStatus(evidences: Evidence[]): SubDocStatus {
  if (evidences.length === 0) return "not_started";
  if (evidences.some(e => e.validationStatus === "approved")) return "approved";
  if (evidences.some(e => e.validationStatus === "rejected")) return "rejected";
  return "pending";
}

const STATUS_CFG = {
  not_started: { label: "Não enviado",       icon: Circle,       cls: "bg-slate-100 text-slate-500 border-slate-200" },
  pending:     { label: "Aguardando análise", icon: Clock,        cls: "bg-amber-50 text-amber-700 border-amber-200"  },
  approved:    { label: "Aprovado",           icon: CheckCircle2, cls: "bg-green-50 text-green-700 border-green-200"  },
  rejected:    { label: "Reprovado",          icon: XCircle,      cls: "bg-red-50 text-red-700 border-red-200"        },
} as const;

function SubDocStatusBadge({ status }: { status: SubDocStatus }) {
  const cfg  = STATUS_CFG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0",
      cfg.cls
    )}>
      <Icon size={10} />{cfg.label}
    </span>
  );
}

function ValidationBadge({ status, comment }: { status: ValidationStatus; comment?: string | null }) {
  const cfg = {
    pending:  { label: "Pendente",  cls: "bg-amber-50  text-amber-700  border-amber-200"  },
    approved: { label: "Aprovado",  cls: "bg-green-50  text-green-700  border-green-200"  },
    rejected: { label: "Reprovado", cls: "bg-red-50    text-red-700    border-red-200"    },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span
      title={comment ?? undefined}
      className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", c.cls)}
    >
      {c.label}
    </span>
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

function SubDocCard({
  subDoc, evidences, checklistItemId, criteriaId, municipalityId, certameId, onUploaded, onDeleted,
}: SubDocCardProps) {
  const fileRef             = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const status     = deriveSubDocStatus(evidences);
  const isApproved = status === "approved";
  // Botão de upload visível sempre que não estiver aprovado
  const showUpload = !isApproved;

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Arquivo muito grande. Máximo: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/evidences/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityId, criteriaId, subDocId: subDoc.id,
          fileName: file.name, fileType: file.type, fileSizeBytes: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error);

      const { presignedUrl, fileKey } = presignData.data;
      const r2 = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!r2.ok) throw new Error("Falha ao enviar para o servidor");

      let itemId = checklistItemId;
      if (!itemId) {
        const chk  = await fetch("/api/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipalityId, certameId, criteriaId, status: "in_progress" }),
        });
        const chkD = await chk.json();
        itemId = chkD.data?.id;
      }
      if (!itemId) throw new Error("Não foi possível criar o item do checklist");

      const evRes  = await fetch("/api/evidences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItemId: itemId, subDocId: subDoc.id,
          kind: "document",
          fileName: file.name, fileKey,
          fileSizeBytes: file.size, fileType: file.type,
        }),
      });
      const evData = await evRes.json();
      if (!evData.success) throw new Error(evData.error);
      onUploaded(evData.data as Evidence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(evId: string) {
    if (!confirm("Remover este arquivo?")) return;
    try {
      const res  = await fetch(`/api/evidences/${evId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Erro ao remover");
      onDeleted(evId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Não foi possível remover o arquivo.");
    }
  }

  const borderCls = cn(
    "rounded-xl border bg-white overflow-hidden transition-all duration-150",
    isApproved               && "border-green-200 bg-green-50/20",
    status === "rejected"    && "border-red-200",
    status === "pending"     && "border-amber-200/80",
    status === "not_started" && "border-slate-200",
  );

  return (
    <div className={borderCls}>
      {/* Cabeçalho */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isApproved            ? "bg-green-100" :
          status === "rejected" ? "bg-red-100"   :
          status === "pending"  ? "bg-amber-100" : "bg-slate-100"
        )}>
          <FileText size={13} className={cn(
            isApproved            ? "text-green-600" :
            status === "rejected" ? "text-red-500"   :
            status === "pending"  ? "text-amber-600" : "text-slate-500"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">{subDoc.label}</span>
            {subDoc.acceptsMultiple && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 font-medium">
                múltiplos arquivos
              </span>
            )}
          </div>
          {subDoc.description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subDoc.description}</p>
          )}
        </div>
        <SubDocStatusBadge status={status} />
      </div>

      {/* Motivo de reprovação */}
      {status === "rejected" && evidences.some(e => e.reviewComment) && (
        <div className="mx-4 mb-3">
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-red-700">Motivo da reprovação</p>
              {evidences
                .filter(e => e.validationStatus === "rejected" && e.reviewComment)
                .map(e => (
                  <p key={e.id} className="text-[11px] text-red-600 mt-0.5">{e.reviewComment}</p>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Arquivos enviados */}
      {evidences.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          {evidences.map(ev => (
            <div key={ev.id} className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 border text-xs",
              ev.validationStatus === "approved" && "bg-green-50 border-green-100",
              ev.validationStatus === "rejected" && "bg-red-50   border-red-100",
              ev.validationStatus === "pending"  && "bg-slate-50 border-slate-100",
            )}>
              <span className="text-base leading-none shrink-0">{getFileIcon(ev.fileType ?? null)}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-700 truncate">{ev.fileName}</p>
                <p className="text-slate-400 text-[10px]">
                  {formatFileSize(ev.fileSizeBytes)}
                  {ev.uploadedAt ? ` · ${new Date(ev.uploadedAt).toLocaleDateString("pt-BR")}` : ""}
                </p>
              </div>
              <ValidationBadge status={ev.validationStatus} comment={ev.reviewComment} />
              <div className="flex items-center gap-0.5 shrink-0">
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver arquivo"
                  className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Eye size={12} />
                </a>
                <a
                  href={ev.fileUrl}
                  download={ev.fileName}
                  title="Baixar arquivo"
                  className="p-1.5 rounded text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Download size={12} />
                </a>
                {ev.validationStatus !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    title="Remover arquivo"
                    className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão de upload — aparece sempre que não aprovado */}
      {showUpload && (
        <div className={cn(
          "px-4 py-3 border-t",
          status === "rejected"    ? "border-red-100   bg-red-50/40"   :
          status === "not_started" ? "border-slate-100 bg-slate-50/30" :
          "border-amber-100 bg-amber-50/20"
        )}>
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            disabled={uploading}
            onChange={async e => {
              const files = Array.from(e.target.files ?? []);
              await Promise.all(files.map(file => handleFile(file)));
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg",
              "text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
              status === "rejected"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                : status === "pending"
                ? "bg-white border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-600 hover:text-brand-700"
                : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
            )}
          >
            {uploading ? (
              <><Loader2 size={13} className="animate-spin" />Enviando…</>
            ) : status === "rejected" ? (
              <><RefreshCw size={13} />Reenviar arquivo corrigido</>
            ) : (
              <><Upload size={13} />Adicionar arquivo</>
            )}
          </button>
          {error && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} />{error}
            </p>
          )}
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            PDF, JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
          </p>
        </div>
      )}

      {/* Aprovado — bloqueado */}
      {isApproved && (
        <div className="px-4 py-2.5 border-t border-green-100 bg-green-50/50 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-green-600 shrink-0" />
          <p className="text-xs text-green-700 font-medium">Documento aprovado pela SEMARH</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GenericUploader
// ─────────────────────────────────────────────────────────────────────────────

interface GenericUploaderProps {
  evidences: Evidence[];
  checklistItemId: string | undefined;
  criteriaId: string;
  municipalityId: string;
  certameId: string;
  kind?: EvidenceKind;
  onUploaded: (ev: Evidence) => void;
  onDeleted:  (evId: string) => void;
}

function GenericUploader({
  evidences, checklistItemId, criteriaId, municipalityId, certameId,
  kind = "document", onUploaded, onDeleted,
}: GenericUploaderProps) {
  const fileRef             = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [isDrag, setIsDrag]       = useState(false);

  async function handleFile(file: File) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Máximo: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/evidences/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityId, criteriaId,
          fileName: file.name, fileType: file.type, fileSizeBytes: file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error);

      const { presignedUrl, fileKey } = presignData.data;
      const r2 = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!r2.ok) throw new Error("Falha ao enviar");

      let itemId = checklistItemId;
      if (!itemId) {
        const chk  = await fetch("/api/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipalityId, certameId, criteriaId, status: "in_progress" }),
        });
        itemId = (await chk.json()).data?.id;
      }
      if (!itemId) throw new Error("Não foi possível criar o item");

      const evRes  = await fetch("/api/evidences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItemId: itemId,
          kind,
          fileName: file.name, fileKey,
          fileSizeBytes: file.size, fileType: file.type,
        }),
      });
      const evData = await evRes.json();
      if (!evData.success) throw new Error(evData.error);
      onUploaded(evData.data as Evidence);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {evidences.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {evidences.map(ev => (
            <div key={ev.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-base shrink-0">{getFileIcon(ev.fileType ?? null)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{ev.fileName}</p>
                <p className="text-[10px] text-slate-400">{formatFileSize(ev.fileSizeBytes)}</p>
              </div>
              <ValidationBadge status={ev.validationStatus} comment={ev.reviewComment} />
              <div className="flex items-center gap-0.5 shrink-0">
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver arquivo"
                  className="p-1.5 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <Eye size={12} />
                </a>
                <a
                  href={ev.fileUrl}
                  download={ev.fileName}
                  title="Baixar arquivo"
                  className="p-1.5 rounded text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                >
                  <Download size={12} />
                </a>
                {ev.validationStatus !== "approved" && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Remover este arquivo?")) return;
                      const r = await fetch(`/api/evidences/${ev.id}`, { method: "DELETE" });
                      const d = await r.json();
                      if (d.success) onDeleted(ev.id);
                      else alert(d.error ?? "Erro ao remover");
                    }}
                    title="Remover arquivo"
                    className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
        disabled={uploading}
        onChange={async e => {
          const files = Array.from(e.target.files ?? []);
          await Promise.all(files.map(file => handleFile(file)));
          if (fileRef.current) fileRef.current.value = "";
        }}
      />

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={e => {
          e.preventDefault();
          setIsDrag(false);
          const files = Array.from(e.dataTransfer.files ?? []);
          Promise.all(files.map(f => handleFile(f)));
        }}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150",
          isDrag ? "border-brand-400 bg-brand-50" : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"
        )}
      >
        {uploading
          ? <Loader2 size={20} className="animate-spin text-brand-500 mx-auto mb-2" />
          : <Upload size={20} className="text-slate-400 mx-auto mb-2" />}
        <p className="text-sm text-slate-600 font-medium">
          {uploading ? "Enviando…" : isDrag ? "Solte aqui" : "Arraste ou clique para selecionar"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          PDF, JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
        </p>
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CriterionModal — com createPortal para evitar clipping por transforms do pai
// ─────────────────────────────────────────────────────────────────────────────

export default function CriterionModal({
  criterion, item, municipalityId, certameId, population, onClose, onSaved,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Garante que o portal só renderiza no cliente
  useEffect(() => { setMounted(true); }, []);

  // ── State ──
  const [status, setStatus]       = useState<ChecklistItem["status"]>(item?.status ?? "not_started");
  const [quantity, setQuantity]   = useState<number | null>(item?.quantity ?? null);
  const [pct, setPct]             = useState<number | null>(
    item?.percentageValue != null ? Number(item.percentageValue) : null
  );
  const [faixaLevel, setFaixa]    = useState<number | null>(item?.faixaLevel ?? null);
  const [mapLink, setMapLink]     = useState(item?.mapLink ?? "");
  const [notes, setNotes]         = useState(item?.notes ?? "");
  const [saving, setSaving]       = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [evidences, setEvidences]   = useState<Evidence[]>((item?.evidences ?? []) as Evidence[]);
  const [loadingEvs, setLoadingEvs] = useState(false);

  const hasSubDocs = (criterion.subDocs?.length ?? 0) > 0;
  const [tab, setTab] = useState<TabId>(hasSubDocs ? "documentos" : "pontuacao");

  const scoringEvidences = evidences.filter(isScoringDoc);
  const supportingEvidences = evidences.filter(e => e.kind === "evidence");

  const pendingDocsCount = hasSubDocs
    ? (criterion.subDocs ?? []).filter(sd => {
        const st = deriveSubDocStatus(scoringEvidences.filter(e => e.subDocId === sd.id));
        return st === "not_started" || st === "rejected";
      }).length
    : 0;

  const pendingSupportingCount = supportingEvidences.filter(
    e => e.validationStatus === "pending" || e.validationStatus === "rejected"
  ).length;

  const fakeItem = { status, quantity, percentageValue: pct, faixaLevel } as unknown as ChecklistItem;
  const points   = calculateItemPoints(fakeItem, criterion, population);

  // Decide se mostra o botão de relatório (só docs que pontuam)
  const hasApprovedEvidences = scoringEvidences.some(e => e.validationStatus === "approved");
  const showReportButton     = !!item?.id && status !== "not_started" && hasApprovedEvidences;

  // Fetch evidências
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

  // Keyboard + scroll lock
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Salvar scoring
  async function handleSave() {
    setSaving(true);
    const res  = await fetch("/api/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipalityId, certameId, criteriaId: criterion.id,
        status, quantity, percentageValue: pct, faixaLevel,
        mapLink: mapLink || null, notes: notes || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      onSaved(data.data as ChecklistItem);
    }
  }

  function handleUploaded(ev: Evidence) {
    setEvidences(prev => [...prev.filter(e => e.id !== ev.id), ev]);
  }
  function handleDeleted(evId: string) {
    setEvidences(prev => prev.filter(e => e.id !== evId));
  }

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "pontuacao",  label: "Pontuação" },
    { id: "documentos", label: "Documentos", badge: pendingDocsCount > 0 ? pendingDocsCount : undefined },
    { id: "evidencias", label: "Evidências", badge: pendingSupportingCount > 0 ? pendingSupportingCount : undefined },
    { id: "requisito",  label: "Requisito" },
  ];

  // ── Conteúdo do modal ──
  const modalContent = (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ isolation: "isolate" }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-surface-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {criterion.id}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-surface-900 text-sm leading-tight">{criterion.description}</h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {criterion.axisName} · máx {criterion.maxPoints} pts
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              points > 0 ? "text-brand-700" : "text-surface-400"
            )}>
              {points} / {criterion.maxPoints} pts
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-100 shrink-0 px-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-surface-500 hover:text-surface-700"
              )}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body — scrollável */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* TAB: PONTUAÇÃO */}
          {tab === "pontuacao" && (
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="label">Status do critério</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ChecklistItem["status"])}
                  className="input"
                >
                  <option value="not_started">Não iniciado</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="complete">Completo</option>
                </select>
              </div>

              {criterion.scoringType === "per_unit" && (
                <div>
                  <label className="label">Quantidade</label>
                  <input
                    type="number" min={0} className="input"
                    placeholder="Número de unidades"
                    value={quantity ?? ""}
                    onChange={e => setQuantity(e.target.value ? Number(e.target.value) : null)}
                  />
                  {criterion.scoringConfig && "unitValue" in criterion.scoringConfig && (
                    <p className="text-xs text-surface-400 mt-1">
                      {(criterion.scoringConfig as { unitValue: number }).unitValue} pts/unidade · máx {criterion.maxPoints} pts
                    </p>
                  )}
                </div>
              )}

              {criterion.scoringType === "percentage" && (
                <div>
                  <label className="label">Cobertura de esgotamento (%)</label>
                  <input
                    type="number" min={0} max={100} step={0.1} className="input"
                    placeholder="Ex: 75.5"
                    value={pct ?? ""}
                    onChange={e => setPct(e.target.value ? Number(e.target.value) : null)}
                  />
                  <p className="text-xs text-surface-400 mt-1">
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
                  <input
                    type="number" min={0} max={100} step={0.1} className="input"
                    placeholder="Ex: 30"
                    value={pct ?? ""}
                    onChange={e => setPct(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              )}

              {criterion.scoringType === "per_faixa" &&
               criterion.scoringConfig && "type" in criterion.scoringConfig &&
               (criterion.scoringConfig as { type: string }).type === "population" && (
                <div>
                  <label className="label">Nível comprovado de mudas plantadas</label>
                  <select
                    value={faixaLevel ?? ""}
                    onChange={e => setFaixa(e.target.value ? Number(e.target.value) : null)}
                    className="input"
                  >
                    <option value="">Selecione o nível atingido</option>
                    <option value="1">Nível 1 — 8 pts</option>
                    <option value="2">Nível 2 — 12 pts</option>
                    <option value="3">Nível 3 — 30 pts (máximo)</option>
                  </select>
                  <p className="text-xs text-surface-400 mt-1">Consulte a tabela C.5 no decreto.</p>
                </div>
              )}

              

              <div>
                <label className="label">Observações internas</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="input resize-none"
                  placeholder="Pendências, contatos, referências de documentos anteriores..."
                />
              </div>

              <div className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border",
                points > 0 ? "bg-brand-50 border-brand-200" : "bg-surface-50 border-surface-200"
              )}>
                <div>
                  <p className="text-xs font-semibold text-surface-600">Pontos calculados</p>
                  <p className="text-[11px] text-surface-400">com os dados informados acima</p>
                </div>
                <span className={cn("text-2xl font-bold tabular-nums", points > 0 ? "text-brand-700" : "text-surface-400")}>
                  {points} pts
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className={cn("btn btn-primary w-full justify-center", justSaved && "bg-green-600 hover:bg-green-600")}
              >
                {saving
                  ? <><Loader2 size={14} className="animate-spin" />Salvando…</>
                  : justSaved
                  ? <><CheckCircle2 size={14} />Salvo!</>
                  : "Salvar pontuação"}
              </button>
            </div>
          )}

          {/* TAB: DOCUMENTOS */}
          {tab === "documentos" && (
            <div className="px-5 py-4">
              {loadingEvs ? (
                <div className="flex items-center justify-center py-8 gap-2 text-surface-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando arquivos…</span>
                </div>
              ) : hasSubDocs ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs text-surface-500">
                    <Info size={13} className="text-brand-500 shrink-0" />
                    <span>
                      Este critério exige <strong>{criterion.subDocs!.length} documentos específicos</strong>.
                      Envie um arquivo para cada item abaixo.
                    </span>
                  </div>

                  {/* Barra de progresso */}
                  {(() => {
                    const total    = criterion.subDocs!.length;
                    const approved = criterion.subDocs!.filter(sd =>
                      deriveSubDocStatus(scoringEvidences.filter(e => e.subDocId === sd.id)) === "approved"
                    ).length;
                    const sent = criterion.subDocs!.filter(sd =>
                      deriveSubDocStatus(scoringEvidences.filter(e => e.subDocId === sd.id)) !== "not_started"
                    ).length;
                    const pctSent = Math.round((sent / total) * 100);
                    return (
                      <div className="bg-surface-50 border border-surface-200 rounded-xl p-3.5 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-surface-700">Documentos enviados</span>
                            <span className="text-xs font-bold text-brand-700">{sent}/{total}</span>
                          </div>
                          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-500 rounded-full transition-all duration-500"
                              style={{ width: `${pctSent}%` }}
                            />
                          </div>
                        </div>
                        {approved > 0 && (
                          <div className="text-center shrink-0">
                            <div className="text-lg font-bold text-green-700">{approved}</div>
                            <div className="text-[10px] text-green-600">aprovados</div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Cards por sub-doc */}
                  {[...(criterion.subDocs ?? [])].sort((a, b) => a.order - b.order).map(sd => (
                    <SubDocCard
                      key={sd.id}
                      subDoc={sd}
                      evidences={scoringEvidences.filter(e => e.subDocId === sd.id)}
                      checklistItemId={item?.id}
                      criteriaId={criterion.id}
                      municipalityId={municipalityId}
                      certameId={certameId}
                      onUploaded={handleUploaded}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-xs text-surface-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <Info size={13} className="text-amber-500 shrink-0" />
                    <span>
                      Este critério ainda não tem documentos específicos cadastrados.
                      Envie os arquivos manualmente conforme a aba &quot;Requisito&quot;.
                    </span>
                  </div>
                  <GenericUploader
                    evidences={scoringEvidences.filter(e => !e.subDocId)}
                    checklistItemId={item?.id}
                    criteriaId={criterion.id}
                    municipalityId={municipalityId}
                    certameId={certameId}
                    kind="document"
                    onUploaded={handleUploaded}
                    onDeleted={handleDeleted}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: EVIDÊNCIAS (não pontuam) */}
          {tab === "evidencias" && (
            <div className="px-5 py-4">
              {loadingEvs ? (
                <div className="flex items-center justify-center py-8 gap-2 text-surface-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Carregando arquivos…</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {supportingEvidences.length === 0 && (
                    <p className="text-sm text-surface-500 text-center py-2">
                      Nenhum arquivo encontrado. Utilize o botão abaixo para enviar as evidências.
                    </p>
                  )}
                  <GenericUploader
                    evidences={supportingEvidences}
                    checklistItemId={item?.id}
                    criteriaId={criterion.id}
                    municipalityId={municipalityId}
                    certameId={certameId}
                    kind="evidence"
                    onUploaded={handleUploaded}
                    onDeleted={handleDeleted}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: REQUISITO */}
          {tab === "requisito" && (
            <div className="px-5 py-4 space-y-4">
              <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                <p className="text-[11px] font-bold text-surface-500 uppercase tracking-wide mb-2">
                  Requisito — Decreto 24.288/2025
                </p>
                <p className="text-sm text-surface-700 leading-relaxed">{criterion.requirement}</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText size={12} /> Documentação comprobatória
                </p>
                <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">{criterion.requiredDocs}</p>
              </div>

              <div className="flex flex-col gap-2">
                {criterion.isReusable && (
                  <div className="flex items-start gap-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <Info size={14} className="text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-800">Documento permanente (Art. 17)</p>
                      <p className="text-xs text-green-700 mt-0.5">
                        Pode ser comprovado com documento de certame anterior. Informe a referência e o ano em que foi aceito.
                      </p>
                    </div>
                  </div>
                )}
                {criterion.validYears === 3 && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Validade especial — 3 anos (Art. 16 §3°)</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Os relatórios deste item podem ser aproveitados por até 3 anos.
                      </p>
                    </div>
                  </div>
                )}
                
              </div>

              {hasSubDocs && (
                <button
                  type="button"
                  onClick={() => setTab("documentos")}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-brand-200
                             bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-sm font-medium"
                >
                  <span>Ir para upload dos documentos</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer — Baixar relatório (visível só quando há evidências aprovadas) */}


      </div>
    </div>
  );

  // Renderiza via portal no document.body para escapar de qualquer transform/overflow do pai
  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
