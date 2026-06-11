// src/app/(dashboard)/admin/municipios/[id]/evidencias/EvidenciasAdminClient.tsx
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Eye, Trash2,
  Loader2, AlertTriangle, FileText, ChevronDown, ChevronUp,
  Filter, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "@/lib/utils";

// ─── Tipos locais ──────────────────────────────────────────────────────────

type ValidationStatus = "pending" | "approved" | "rejected";

interface EvidenceItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number | null;
  fileType: string | null;
  uploadedAt: string;
  validationStatus: ValidationStatus;
  reviewComment: string | null;
  validatedAt: string | null;
  uploader:  { id: string; name: string; email: string };
  validator: { id: string; name: string } | null;
  subDoc:    { id: string; label: string; code: string } | null;
}

interface ChecklistItemWithEvidences {
  id: string;
  criteriaId: string;
  criteria: { id: string; description: string; axis: string; axisName: string };
  evidences: EvidenceItem[];
}

interface Props {
  municipalityId: string;
  municipalityName: string;
  certameYear: number;
  items: ChecklistItemWithEvidences[];
  stats: { total: number; pending: number; approved: number; rejected: number };
}

// ─── Modal de aprovação/rejeição ───────────────────────────────────────────

function ReviewModal({
  evidence,
  action,
  onClose,
  onDone,
}: {
  evidence: EvidenceItem;
  action: "approve" | "reject";
  onClose: () => void;
  onDone: (evId: string, status: ValidationStatus, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const isReject = action === "reject";

  async function handleSubmit() {
    if (isReject && !comment.trim()) { setError("Informe o motivo da rejeição."); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`/api/evidences/${evidence.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: comment.trim() || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Erro ao salvar");
      onDone(evidence.id, isReject ? "rejected" : "approved", comment.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
        style={{ animation: "fadeIn 0.18s ease both" }}>

        <div>
          <h3 className={cn("text-base font-bold", isReject ? "text-red-700" : "text-emerald-700")}>
            {isReject ? "Rejeitar arquivo" : "Aprovar arquivo"}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{evidence.fileName}</p>
        </div>

        {/* Preview do arquivo */}
        <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:bg-slate-100 transition-colors">
          <span className="text-lg">{getFileIcon(evidence.fileType)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">{evidence.fileName}</p>
            <p className="text-[11px] text-slate-400">{formatFileSize(evidence.fileSizeBytes)} · Enviado por {evidence.uploader.name}</p>
          </div>
          <Eye size={14} className="text-slate-400 shrink-0" />
        </a>

        {/* Comentário */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            {isReject ? "Motivo da rejeição *" : "Comentário (opcional)"}
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder={isReject
              ? "Ex: A foto não possui georreferenciamento exigido pelo edital..."
              : "Observação opcional para o funcionário..."}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400
                       resize-none placeholder:text-slate-400"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertTriangle size={12} />{error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isReject ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}>
            {loading
              ? <><Loader2 size={13} className="animate-spin" />Salvando…</>
              : isReject ? <><XCircle size={13} />Rejeitar</> : <><CheckCircle2 size={13} />Aprovar</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

// ─── Linha de evidência ────────────────────────────────────────────────────

function EvidenceRow({
  ev,
  onReview,
  onDelete,
}: {
  ev: EvidenceItem;
  onReview: (ev: EvidenceItem, action: "approve" | "reject") => void;
  onDelete: (ev: EvidenceItem) => void;
}) {
  const statusCls = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  }[ev.validationStatus];

  const StatusIcon = ev.validationStatus === "approved" ? CheckCircle2
    : ev.validationStatus === "rejected" ? XCircle : Clock;

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors",
      ev.validationStatus === "approved" ? "bg-emerald-50/30 border-emerald-100" :
      ev.validationStatus === "rejected" ? "bg-red-50/30 border-red-100" :
      "bg-white border-slate-200 hover:border-slate-300"
    )}>
      {/* Ícone do arquivo */}
      <span className="text-xl leading-none shrink-0 mt-0.5">{getFileIcon(ev.fileType)}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-800 truncate">{ev.fileName}</p>
          {ev.subDoc && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 font-medium shrink-0">
              {ev.subDoc.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border", statusCls)}>
            <StatusIcon size={10} className="shrink-0" />
            {ev.validationStatus === "pending" ? "Pendente" : ev.validationStatus === "approved" ? "Aprovado" : "Rejeitado"}
          </span>
          <span className="text-[11px] text-slate-400">
            {formatFileSize(ev.fileSizeBytes)} · {ev.uploader.name} · {new Date(ev.uploadedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* Comentário de rejeição */}
        {ev.reviewComment && (
          <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
            <AlertTriangle size={11} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-700">{ev.reviewComment}</p>
          </div>
        )}

        {/* Validado por */}
        {ev.validator && ev.validatedAt && (
          <p className="text-[10px] text-slate-400 mt-1">
            {ev.validationStatus === "approved" ? "Aprovado" : "Rejeitado"} por {ev.validator.name} em {new Date(ev.validatedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer" title="Ver arquivo"
          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
          <Eye size={14} />
        </a>

        {ev.validationStatus !== "approved" && (
          <button type="button" title="Aprovar" onClick={() => onReview(ev, "approve")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <CheckCircle2 size={14} />
          </button>
        )}

        {ev.validationStatus !== "rejected" && (
          <button type="button" title="Rejeitar" onClick={() => onReview(ev, "reject")}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <XCircle size={14} />
          </button>
        )}

        <button type="button" title="Excluir" onClick={() => onDelete(ev)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Card por critério ─────────────────────────────────────────────────────

function CriterionCard({
  item,
  onReview,
  onDelete,
}: {
  item: ChecklistItemWithEvidences;
  onReview: (ev: EvidenceItem, action: "approve" | "reject") => void;
  onDelete: (ev: EvidenceItem) => void;
}) {
  const pending  = item.evidences.filter(e => e.validationStatus === "pending").length;
  const approved = item.evidences.filter(e => e.validationStatus === "approved").length;
  const rejected = item.evidences.filter(e => e.validationStatus === "rejected").length;
  const allDone  = pending === 0;

  const [expanded, setExpanded] = useState(pending > 0);

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      pending > 0  ? "border-amber-200 bg-amber-50/20" :
      rejected > 0 ? "border-red-200 bg-red-50/10" :
      "border-emerald-200 bg-emerald-50/10"
    )}>
      {/* Header */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-black/[0.02] transition-colors">

        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
          pending > 0 ? "bg-amber-100 text-amber-700" :
          rejected > 0 ? "bg-red-100 text-red-700" :
          "bg-emerald-100 text-emerald-700"
        )}>
          {item.criteria.id}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{item.criteria.description}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{item.criteria.axisName}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pending > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
              <Clock size={9} />{pending} pendente{pending > 1 ? "s" : ""}
            </span>
          )}
          {approved > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold">{approved} ✓</span>
          )}
          {rejected > 0 && (
            <span className="text-[11px] text-red-500 font-semibold">{rejected} ✗</span>
          )}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-2">
          {item.evidences.map(ev => (
            <EvidenceRow key={ev.id} ev={ev} onReview={onReview} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function EvidenciasAdminClient({ municipalityId, municipalityName, certameYear, items: initialItems, stats: initialStats }: Props) {
  const router = useRouter();
  const [items, setItems]   = useState<ChecklistItemWithEvidences[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewing, setReviewing] = useState<{ ev: EvidenceItem; action: "approve" | "reject" } | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Stats derivados do estado local
  const stats = {
    total:    items.reduce((a, i) => a + i.evidences.length, 0),
    pending:  items.reduce((a, i) => a + i.evidences.filter(e => e.validationStatus === "pending").length, 0),
    approved: items.reduce((a, i) => a + i.evidences.filter(e => e.validationStatus === "approved").length, 0),
    rejected: items.reduce((a, i) => a + i.evidences.filter(e => e.validationStatus === "rejected").length, 0),
  };

  function handleReviewDone(evId: string, status: ValidationStatus, comment: string) {
    setItems(prev => prev.map(item => ({
      ...item,
      evidences: item.evidences.map(ev =>
        ev.id === evId ? { ...ev, validationStatus: status, reviewComment: comment || null } : ev
      ),
    })));
  }

  async function handleDelete(ev: EvidenceItem) {
    if (!confirm(`Excluir "${ev.fileName}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(ev.id);
    try {
      const res  = await fetch(`/api/evidences/${ev.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setItems(prev => prev.map(item => ({
        ...item,
        evidences: item.evidences.filter(e => e.id !== ev.id),
      })).filter(item => item.evidences.length > 0));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    } finally { setDeleting(null); }
  }

  // Filtra items pelo status selecionado
  const filteredItems = filter === "all"
    ? items
    : items.map(item => ({
        ...item,
        evidences: item.evidences.filter(e => e.validationStatus === filter),
      })).filter(item => item.evidences.length > 0);

  return (
    <>
      {reviewing && (
        <ReviewModal
          evidence={reviewing.ev}
          action={reviewing.action}
          onClose={() => setReviewing(null)}
          onDone={handleReviewDone}
        />
      )}

      <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">

          {/* Header */}
          <div>
            <button type="button" onClick={() => router.push(`/admin/municipios/${municipalityId}`)}
              className="flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 mb-4 transition-colors">
              <ArrowLeft size={14} />Voltar ao município
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-xl font-bold text-slate-800">Validação de Evidências</h1>
                <p className="text-sm text-slate-500 mt-0.5">{municipalityName} · Certame {certameYear}</p>
              </div>
              <button type="button" onClick={() => router.refresh()}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                <RefreshCw size={14} />Atualizar
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total",      value: stats.total,    color: "text-slate-700",   bg: "bg-white border-slate-200",           filter: "all"      },
              { label: "Pendentes",  value: stats.pending,  color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",        filter: "pending"  },
              { label: "Aprovados",  value: stats.approved, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200",    filter: "approved" },
              { label: "Rejeitados", value: stats.rejected, color: "text-red-700",     bg: "bg-red-50 border-red-200",            filter: "rejected" },
            ].map(s => (
              <button key={s.filter} type="button"
                onClick={() => setFilter(s.filter as typeof filter)}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-center transition-all",
                  s.bg,
                  filter === s.filter && "ring-2 ring-brand-400 ring-offset-1"
                )}>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
              </button>
            ))}
          </div>

          {/* Filtro ativo */}
          {filter !== "all" && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter size={13} className="text-slate-400" />
              Mostrando: <strong className="text-slate-800">
                {filter === "pending" ? "Pendentes" : filter === "approved" ? "Aprovados" : "Rejeitados"}
              </strong>
              <button type="button" onClick={() => setFilter("all")}
                className="text-xs text-brand-600 hover:underline ml-1">Ver todos</button>
            </div>
          )}

          {/* Lista */}
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <FileText size={20} className="text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">
                {filter === "all" ? "Nenhuma evidência enviada ainda." : `Nenhuma evidência ${filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : "rejeitada"}.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredItems.map(item => (
                <CriterionCard
                  key={item.id}
                  item={item}
                  onReview={(ev, action) => setReviewing({ ev, action })}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}