// src/app/(dashboard)/admin/municipios/[id]/habilitacao/AdminHabilitacaoClient.tsx
// Admin pode fazer upload E validar na mesma tela (único admin na empresa)
"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, CheckCircle, XCircle, Clock, Circle, Eye,
  ShieldCheck, ShieldX, ArrowLeft, Loader2, AlertTriangle,
  Upload, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type HabDocStatus = "not_started" | "pending" | "approved" | "rejected";
type HabDocCode =
  | "CONSELHO_CRIACAO" | "CONSELHO_ATA"
  | "SECRETARIA_CRIACAO" | "SECRETARIA_NOMEACAO" | "SECRETARIA_QUADRO"
  | "PLANO_DIRETOR";

interface HabFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  uploadedAt: Date | string;
  uploader: { name: string; email: string };
}

interface HabDoc {
  id: string | null;
  code: HabDocCode;
  status: HabDocStatus;
  rejectReason: string | null;
  validatedAt: Date | string | null;
  validator: { name: string } | null;
  files: HabFile[];
}

interface Props {
  municipioId: string;
  municipalityName: string;
  certameYear: number;
  backTo?: string;
  docs: HabDoc[];
  isHabilitado: boolean;
}

const DOC_META: Record<HabDocCode, { label: string; group: string; required: boolean; description: string }> = {
  CONSELHO_CRIACAO:    { label: "Lei/Decreto de Criação do Conselho",      group: "Conselho Municipal",   required: true,  description: "Instrumento legal de criação do Conselho Municipal de Defesa do Meio Ambiente" },
  CONSELHO_ATA:        { label: "Ata de Reunião do Conselho",              group: "Conselho Municipal",   required: true,  description: "Ata comprovando funcionamento regular do conselho no período de apuração" },
  SECRETARIA_CRIACAO:  { label: "Lei de Criação do Órgão Ambiental",       group: "Secretaria Municipal", required: true,  description: "Instrumento legal de criação da secretaria ou órgão com competências ambientais" },
  SECRETARIA_NOMEACAO: { label: "Ato de Nomeação do Secretário/Técnicos",  group: "Secretaria Municipal", required: true,  description: "Decreto ou ato de nomeação dos responsáveis pelo órgão ambiental municipal" },
  SECRETARIA_QUADRO:   { label: "Comprovação do Quadro de Profissionais",  group: "Secretaria Municipal", required: true,  description: "Documentação do quadro mínimo de profissionais (Art. 15 — Decreto 24.288/2025)" },
  PLANO_DIRETOR:       { label: "Plano Diretor com Capítulo Ambiental",    group: "Plano Diretor",        required: false, description: "Cópia do Plano Diretor Municipal com capítulo sobre política ambiental (quando couber)" },
};

const GROUPS = ["Conselho Municipal", "Secretaria Municipal", "Plano Diretor"] as const;

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HabDocStatus | "habilitado" }) {
  const cfg = {
    not_started: { label: "Não enviado",        icon: Circle,      cls: "bg-slate-100 text-slate-500 border-slate-200" },
    pending:     { label: "Aguardando análise", icon: Clock,       cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved:    { label: "Aprovado",           icon: CheckCircle, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected:    { label: "Reprovado",          icon: XCircle,     cls: "bg-red-50 text-red-700 border-red-200" },
    habilitado:  { label: "Habilitado",         icon: ShieldCheck, cls: "bg-emerald-600 text-white border-emerald-600" },
  } as const;
  const c = cfg[status] ?? cfg.not_started;
  const Icon = c.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border", c.cls)}>
      <Icon size={11} />{c.label}
    </span>
  );
}

// ─── Modal de validação ───────────────────────────────────────────────────────

function ValidateModal({ doc, municipioId, onClose, onDone }: {
  doc: HabDoc;
  municipioId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action,       setAction]       = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error,        setError]        = useState("");
  const [isPending, startTransition]    = useTransition();

  function fmtBytes(b: number | null) {
    if (!b) return "";
    return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleSubmit() {
    if (!action) return;
    if (action === "reject" && !rejectReason.trim()) { setError("Informe o motivo da reprovação."); return; }
    if (!doc.id) { setError("Envie ao menos um arquivo antes de validar."); return; }
    setError("");

    startTransition(async () => {
      const res  = await fetch(`/api/habilitacao/${municipioId}/${doc.id}/validate`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:       action === "approve" ? "approved" : "rejected",
          rejectReason: rejectReason.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Erro ao validar."); return; }
      onDone();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
        style={{ animation: "fadeSlideUp 0.2s ease both" }}>

        <div>
          <h3 className="text-base font-bold text-slate-800">Validar Documento</h3>
          <p className="text-xs text-slate-500 mt-0.5">{DOC_META[doc.code].label}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Arquivos ({doc.files.length})
          </p>
          {doc.files.map(f => (
            <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2
                         text-xs text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all">
              <FileText size={12} className="shrink-0" />
              <span className="truncate flex-1">{f.fileName}</span>
              <span className="text-slate-400 shrink-0">{fmtBytes(f.fileSizeBytes)}</span>
              <Eye size={11} className="shrink-0" />
            </a>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="button"
            onClick={() => { setAction("approve"); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
              action === "approve"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
            )}>
            <CheckCircle size={14} />Aprovar
          </button>
          <button type="button"
            onClick={() => { setAction("reject"); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all",
              action === "reject"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-red-300 hover:text-red-700"
            )}>
            <XCircle size={14} />Reprovar
          </button>
        </div>

        {action === "reject" && (
          <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Motivo da reprovação *
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Descreva o que está pendente ou incorreto..."
              className="w-full mt-1.5 px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400
                         resize-none placeholder:text-slate-400"
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertTriangle size={12} />{error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200
                       text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit}
            disabled={!action || isPending}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              action === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            )}>
            {isPending ? <><Loader2 size={13} className="animate-spin" />Salvando…</> : "Confirmar"}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Doc Card (admin) — upload + validação ────────────────────────────────────

function AdminDocCard({ doc, municipioId, onRefresh, onValidate }: {
  doc: HabDoc;
  municipioId: string;
  onRefresh: () => void;
  onValidate: (doc: HabDoc) => void;
}) {
  const meta       = DOC_META[doc.code];
  const isApproved = doc.status === "approved";
  const [expanded,    setExpanded]    = useState(doc.status !== "approved");
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fmtBytes(b: number | null) {
    if (!b) return "";
    return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);

    try {
      // 1. URL presignada
      const presignRes = await fetch("/api/habilitacao/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityId: municipioId,
          docCode:        doc.code,
          fileName:       file.name,
          fileType:       file.type || "application/octet-stream",
          fileSizeBytes:  file.size,
        }),
      });
      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error ?? "Erro ao gerar URL de upload");
      const { presignedUrl, fileKey } = presignData.data;

      // 2. Upload direto R2
      const r2Res = await fetch(presignedUrl, {
        method:  "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body:    file,
      });
      if (!r2Res.ok) throw new Error(`Falha no upload (${r2Res.status})`);

      // 3. Registra no banco (fileUrl montada no servidor)
      const regRes = await fetch(`/api/habilitacao/${municipioId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docCode:       doc.code,
          fileName:      file.name,
          fileKey,
          fileSizeBytes: file.size,
          fileType:      file.type || "application/octet-stream",
        }),
      });
      const regData = await regRes.json();
      if (!regData.success) throw new Error(regData.error ?? "Erro ao registrar arquivo");

      onRefresh();
    } catch (err: unknown) {
      console.error("[AdminDocCard/upload]", err);
      setUploadError(err instanceof Error ? err.message : "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Remover este arquivo?")) return;
    setDeleting(fileId);
    try {
      const res  = await fetch(`/api/habilitacao/${municipioId}/file/${fileId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onRefresh();
    } catch {
      alert("Não foi possível remover o arquivo.");
    } finally {
      setDeleting(null);
    }
  }

  const hasPending = doc.status === "pending" && doc.files.length > 0;

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all duration-200",
      isApproved               && "border-emerald-200",
      doc.status === "rejected"    && "border-red-200",
      doc.status === "pending"     && "border-amber-200",
      doc.status === "not_started" && "border-slate-200",
    )}>

      {/* Header clicável */}
      <button type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors">
        <FileText size={15} className={cn(
          "shrink-0",
          isApproved               ? "text-emerald-500"
          : doc.status === "rejected"   ? "text-red-400"
          : doc.status === "pending"    ? "text-amber-400"
          : "text-slate-400"
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{meta.label}</p>
          {!meta.required && <p className="text-[10px] text-slate-400 mt-0.5">quando couber — Art. 15</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={doc.status} />
          {doc.files.length > 0 && <span className="text-[11px] text-slate-400">{doc.files.length} arq.</span>}
          {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      {/* Conteúdo expansível */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-slate-500 leading-relaxed">{meta.description}</p>

          {doc.status === "rejected" && doc.rejectReason && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <ShieldX size={14} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700">Motivo da reprovação</p>
                <p className="text-xs text-red-600 mt-0.5">{doc.rejectReason}</p>
              </div>
            </div>
          )}

          {doc.validator?.name && doc.validatedAt && (
            <p className="text-[11px] text-slate-400">
              Analisado por <strong>{doc.validator.name}</strong>{" "}
              em {new Date(doc.validatedAt).toLocaleDateString("pt-BR")}
            </p>
          )}

          {/* Arquivos enviados */}
          {doc.files.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {doc.files.map(f => (
                <li key={f.id}
                  className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={12} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{f.fileName}</p>
                      <p className="text-[11px] text-slate-400">
                        {fmtBytes(f.fileSizeBytes)}{f.fileSizeBytes ? " · " : ""}
                        {new Date(f.uploadedAt).toLocaleDateString("pt-BR")}
                        {f.uploader?.name ? ` · ${f.uploader.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <Eye size={13} />
                    </a>
                    {!isApproved && (
                      <button type="button" onClick={() => handleDelete(f.id)}
                        disabled={deleting === f.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                        {deleting === f.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Nenhum arquivo enviado ainda.</p>
          )}
        </div>
      )}

      {/* ── Footer: upload + validar ── */}
      {!isApproved && (
        <div className={cn(
          "px-5 py-3 border-t flex flex-col gap-2",
          doc.status === "rejected" ? "border-red-100 bg-red-50/30" : "border-slate-100 bg-slate-50/50"
        )}>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className="flex gap-2">
            {/* Botão upload */}
            <button type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl",
                "text-sm font-semibold transition-all duration-150",
                "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]",
                doc.status === "rejected"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              )}>
              {uploading
                ? <><Loader2 size={14} className="animate-spin" />Enviando…</>
                : <><Upload size={14} />{doc.files.length > 0 ? "Adicionar arquivo" : "Enviar documento"}</>
              }
            </button>

            {/* Botão validar — só aparece se há arquivos */}
            {doc.files.length > 0 && (
              <button type="button"
                onClick={() => onValidate(doc)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl",
                  "text-sm font-semibold transition-all duration-150 active:scale-[0.99]",
                  hasPending
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-slate-700 text-white hover:bg-slate-800"
                )}>
                {hasPending
                  ? <><Clock size={14} />Analisar</>
                  : <><ShieldX size={14} />Revalidar</>
                }
              </button>
            )}
          </div>

          {uploadError && (
            <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{uploadError}</p>
            </div>
          )}
        </div>
      )}

      {/* Aprovado */}
      {isApproved && (
        <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
          <CheckCircle size={13} className="text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">Documento aprovado — nenhuma ação necessária</p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AdminHabilitacaoClient({
  municipioId, municipalityName, certameYear, backTo = "/admin/municipios", docs: initialDocs, isHabilitado: initialHabilitado,
}: Props) {
  const router = useRouter();
  const [docs,         setDocs]         = useState<HabDoc[]>(initialDocs);
  const [habilitado,   setHabilitado]   = useState(initialHabilitado);
  const [validatingDoc, setValidatingDoc] = useState<HabDoc | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchDocs = useCallback(async () => {
    setRefreshing(true);
    try {
      const res  = await fetch(`/api/habilitacao/${municipioId}`);
      const json = await res.json();
      if (json.success) {
        setDocs(json.data.docs);
        setHabilitado(json.data.isHabilitado);
      }
    } finally {
      setRefreshing(false);
    }
  }, [municipioId]);

  function handleDone() { fetchDocs(); }

  const pendingCount  = docs.filter(d => d.status === "pending").length;
  const approvedCount = docs.filter(d => d.status === "approved").length;
  const rejectedCount = docs.filter(d => d.status === "rejected").length;
  const notStarted    = docs.filter(d => d.status === "not_started").length;
  const REQUIRED      = 5;

  return (
    <>
      {validatingDoc && (
        <ValidateModal
          doc={validatingDoc}
          municipioId={municipioId}
          onClose={() => setValidatingDoc(null)}
          onDone={handleDone}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div>
          <button type="button"
            onClick={() => router.push(backTo)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors mb-3 w-fit">
            <ArrowLeft size={14} />
            {backTo.startsWith("/admin/municipios/") ? "Voltar à edição" : "Voltar para municípios"}
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Habilitação Municipal</h1>
                {refreshing && <Loader2 size={14} className="animate-spin text-slate-400" />}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{municipalityName} · Certame {certameYear}</p>
              <p className="text-xs text-slate-400 mt-0.5">Decreto 24.288/2025, Art. 15</p>
            </div>
            <StatusBadge status={habilitado ? "habilitado" : pendingCount > 0 ? "pending" : rejectedCount > 0 ? "rejected" : "not_started"} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Aprovados",    value: `${approvedCount}/${REQUIRED}`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Aguardando",   value: pendingCount,  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200"  },
            { label: "Reprovados",   value: rejectedCount, color: "text-red-700",    bg: "bg-red-50 border-red-200"      },
            { label: "Não enviados", value: notStarted,    color: "text-slate-600",  bg: "bg-slate-50 border-slate-200"  },
          ].map(s => (
            <div key={s.label} className={cn("rounded-2xl border px-3 py-3 text-center", s.bg)}>
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Banner habilitado */}
        {habilitado && (
          <div className="flex items-center gap-3 bg-emerald-600 text-white rounded-2xl px-5 py-4">
            <ShieldCheck size={20} className="shrink-0" />
            <div>
              <p className="font-bold text-sm">Município Habilitado!</p>
              <p className="text-xs text-emerald-100 mt-0.5">Todos os requisitos obrigatórios foram aprovados.</p>
            </div>
          </div>
        )}

        {/* Grupos */}
        {GROUPS.map(group => {
          const groupDocs = docs.filter(d => DOC_META[d.code].group === group);
          if (groupDocs.length === 0) return null;
          return (
            <section key={group} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  {group}
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              {groupDocs.map(doc => (
                <AdminDocCard
                  key={doc.code}
                  doc={doc}
                  municipioId={municipioId}
                  onRefresh={fetchDocs}
                  onValidate={setValidatingDoc}
                />
              ))}
            </section>
          );
        })}

        <p className="text-center text-xs text-slate-400 pt-2">
          Decreto 24.288/2025 · SEMARH — Estado do Piauí
        </p>
      </div>
    </>
  );
}
