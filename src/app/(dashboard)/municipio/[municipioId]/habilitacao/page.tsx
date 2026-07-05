// src/app/(dashboard)/municipio/[municipioId]/habilitacao/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Upload, FileText, CheckCircle, AlertCircle, Clock,
  Circle, XCircle, ChevronDown, ChevronUp, Loader2,
  Eye, Trash2, ShieldCheck, ShieldX, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  fileType: string | null;
  uploadedAt: string;
  uploader: { name: string; email: string };
}

interface HabDoc {
  id: string | null;
  code: HabDocCode;
  status: HabDocStatus;
  rejectReason: string | null;
  validatedAt: string | null;
  validator?: { name: string } | null;
  files: HabFile[];
}

interface HabData {
  municipalityId: string;
  municipalityName: string;
  certameId: string;
  certameYear: number;
  docs: HabDoc[];
  isHabilitado: boolean;
}

// ─── Metadados ────────────────────────────────────────────────────────────────

const DOC_META: Record<HabDocCode, {
  label: string;
  group: string;
  required: boolean;
  description: string;
}> = {
  CONSELHO_CRIACAO:    { label: "Lei/Decreto de Criação do Conselho",     group: "Conselho Municipal de Defesa do Meio Ambiente", required: true,  description: "Instrumento legal de criação do Conselho Municipal de Defesa do Meio Ambiente" },
  CONSELHO_ATA:        { label: "Ata de Reunião do Conselho",             group: "Conselho Municipal de Defesa do Meio Ambiente", required: true,  description: "Ata comprovando funcionamento regular do conselho no período de apuração" },
  SECRETARIA_CRIACAO:  { label: "Lei de Criação do Órgão Ambiental",      group: "Secretaria Municipal de Meio Ambiente",         required: true,  description: "Instrumento legal de criação da secretaria ou órgão com competências ambientais" },
  SECRETARIA_NOMEACAO: { label: "Ato de Nomeação do Secretário/Técnicos", group: "Secretaria Municipal de Meio Ambiente",         required: true,  description: "Decreto ou ato de nomeação dos responsáveis pelo órgão ambiental municipal" },
  SECRETARIA_QUADRO:   { label: "Comprovação do Quadro de Profissionais", group: "Secretaria Municipal de Meio Ambiente",         required: true,  description: "Documentação do quadro mínimo de profissionais (Art. 15 — Decreto 24.288/2025)" },
  PLANO_DIRETOR:       { label: "Plano Diretor com Capítulo Ambiental",   group: "Plano Diretor Municipal",                      required: false, description: "Cópia do Plano Diretor Municipal com capítulo sobre política ambiental (quando couber)" },
};

const GROUPS = [
  "Conselho Municipal de Defesa do Meio Ambiente",
  "Secretaria Municipal de Meio Ambiente",
  "Plano Diretor Municipal",
];

const REQUIRED_CODES: HabDocCode[] = [
  "CONSELHO_CRIACAO", "CONSELHO_ATA",
  "SECRETARIA_CRIACAO", "SECRETARIA_NOMEACAO", "SECRETARIA_QUADRO",
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HabDocStatus | "habilitado" }) {
  const config = {
    not_started: { label: "Não iniciado",        icon: <Circle size={11} />,       cls: "bg-slate-100 text-slate-500 border-slate-200" },
    pending:     { label: "Pendente de análise", icon: <Clock size={11} />,        cls: "bg-amber-50 text-amber-700 border-amber-200" },
    approved:    { label: "Aprovado",            icon: <CheckCircle size={11} />,  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    rejected:    { label: "Reprovado",           icon: <XCircle size={11} />,      cls: "bg-red-50 text-red-700 border-red-200" },
    habilitado:  { label: "Habilitado",          icon: <ShieldCheck size={11} />,  cls: "bg-emerald-600 text-white border-emerald-600" },
  } as const;

  const cfg = config[status] ?? config.not_started;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border", cfg.cls)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Doc Card ─────────────────────────────────────────────────────────────────

function DocCard({ doc, municipioId, onRefresh }: {
  doc: HabDoc;
  municipioId: string;
  onRefresh: () => void;
}) {
  const meta       = DOC_META[doc.code];
  const isApproved = doc.status === "approved";
  const [expanded, setExpanded]       = useState(doc.status !== "approved");
  const [uploading, setUploading]     = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExpanded(doc.status !== "approved");
  }, [doc.status]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
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

      if (!presignRes.ok) {
        const txt = await presignRes.text();
        throw new Error(`Erro ao gerar URL de upload (${presignRes.status}): ${txt}`);
      }

      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error ?? "Erro ao gerar URL de upload");

      const { presignedUrl, fileKey } = presignData.data;

      const r2Res = await fetch(presignedUrl, {
        method:  "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body:    file,
      });
      if (!r2Res.ok) throw new Error(`Falha no upload para o servidor de arquivos (${r2Res.status})`);

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

      if (!regRes.ok) {
        const txt = await regRes.text();
        throw new Error(`Erro ao registrar arquivo (${regRes.status}): ${txt}`);
      }

      const regData = await regRes.json();
      if (!regData.success) throw new Error(regData.error ?? "Erro ao registrar arquivo no sistema");

      onRefresh();
    } catch (err: unknown) {
      console.error("[DocCard/upload]", err);
      setUploadError(err instanceof Error ? err.message : "Erro desconhecido ao enviar arquivo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDeleteFile(fileId: string) {
    if (!confirm("Remover este arquivo da habilitação?")) return;
    try {
      const res  = await fetch(`/api/habilitacao/${municipioId}/file/${fileId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Erro ao remover arquivo");
      onRefresh();
    } catch {
      alert("Não foi possível remover o arquivo. Tente novamente.");
    }
  }

  function fmtBytes(b: number | null) {
    if (!b) return "";
    return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all duration-200",
      isApproved                   && "border-emerald-200 shadow-emerald-50 shadow-sm",
      doc.status === "rejected"    && "border-red-200",
      doc.status === "pending"     && "border-amber-200",
      doc.status === "not_started" && "border-slate-200 shadow-sm",
    )}>

      {/* Cabeçalho clicável */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <FileText size={15} className={cn(
          "shrink-0",
          isApproved                   ? "text-emerald-500"
          : doc.status === "rejected"  ? "text-red-400"
          : doc.status === "pending"   ? "text-amber-400"
          : "text-slate-400"
        )} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{meta.label}</p>
          {!meta.required && (
            <p className="text-[10px] text-slate-400 mt-0.5">quando couber — Art. 15</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={doc.status} />
          {doc.files.length > 0 && (
            <span className="text-[11px] text-slate-400">{doc.files.length} arq.</span>
          )}
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
                      title="Visualizar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <Eye size={13} />
                    </a>
                    {!isApproved && (
                      <button type="button" onClick={() => handleDeleteFile(f.id)}
                        title="Remover arquivo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
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

      {/* Botão de upload — sempre visível quando não aprovado */}
      {!isApproved && (
        <div className={cn(
          "px-5 py-3 border-t",
          doc.status === "rejected"
            ? "border-red-100 bg-red-50/40"
            : "border-slate-100 bg-slate-50/60"
        )}>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl",
              "text-sm font-semibold transition-all duration-150",
              "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]",
              doc.status === "rejected"
                ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
            )}
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin" />Enviando…</>
              : <>
                  <Upload size={14} />
                  {doc.status === "rejected"
                    ? "Reenviar documento corrigido"
                    : doc.files.length > 0
                    ? "Adicionar outro arquivo"
                    : "Enviar documento"}
                </>
            }
          </button>

          {uploadError && (
            <div className="mt-2 flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
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

// ─── Página principal ─────────────────────────────────────────────────────────

export default function MunicipalHabilitacaoPage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const municipioId  = params?.municipioId as string;

  // ?from=painel  → volta ao painel do município
  // ?from=lista   → volta à lista de municípios do admin
  // sem ?from     → fallback: painel do município
  const from = searchParams.get("from");
  const backHref = from === "lista"
    ? "/admin/municipios"
    : `/municipio/${municipioId}`;
  const backLabel = from === "lista"
    ? "Voltar à lista"
    : "Voltar ao painel";

  const [data,    setData]    = useState<HabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!municipioId) return;
    try {
      setLoading(true);
      const res  = await fetch(`/api/habilitacao/${municipioId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Erro ao carregar dados.");
      setData(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }, [municipioId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <Loader2 size={22} className="animate-spin text-emerald-500" />
      <p className="text-sm text-slate-400">Carregando documentos...</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <AlertCircle size={20} className="text-red-400" />
      <p className="text-sm text-red-500">{error ?? "Não foi possível carregar os dados."}</p>
      <button onClick={fetchData} className="text-xs text-emerald-600 underline underline-offset-2">
        Tentar novamente
      </button>
    </div>
  );

  const approvedRequired = data.docs.filter(d => REQUIRED_CODES.includes(d.code) && d.status === "approved").length;
  const rejectedCount    = data.docs.filter(d => d.status === "rejected").length;
  const pendingCount     = data.docs.filter(d => d.status === "pending").length;

  const globalStatus = data.isHabilitado ? "habilitado"
    : rejectedCount > 0                  ? "rejected"
    : pendingCount  > 0                  ? "pending"
    : "not_started";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-700/60 hover:text-emerald-700 group transition-colors duration-200 w-fit mb-6"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          {backLabel}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Habilitação Municipal</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {data.municipalityName} · Certame {data.certameYear}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Decreto 24.288/2025, Art. 15 — Pré-condições obrigatórias
            </p>
          </div>
          <StatusBadge status={globalStatus} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Aprovados",  value: `${approvedRequired}/${REQUIRED_CODES.length}`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
          { label: "Pendentes",  value: pendingCount,  color: "text-amber-700",         bg: "bg-amber-50 border-amber-200" },
          { label: "Reprovados", value: rejectedCount, color: "text-red-700",           bg: "bg-red-50 border-red-200" },
        ].map(s => (
          <div key={s.label} className={cn("rounded-2xl border px-4 py-3 text-center", s.bg)}>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Banner habilitado */}
      {data.isHabilitado && (
        <div className="flex items-center gap-3 bg-emerald-600 text-white rounded-2xl px-5 py-4">
          <ShieldCheck size={22} className="shrink-0" />
          <div>
            <p className="font-bold text-sm">Município Habilitado!</p>
            <p className="text-xs text-emerald-100 mt-0.5">
              Todos os requisitos obrigatórios foram aprovados. O município está apto a participar do certame.
            </p>
          </div>
        </div>
      )}

      {/* Alerta reprovação */}
      {!data.isHabilitado && rejectedCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <ShieldX size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {rejectedCount} documento{rejectedCount > 1 ? "s" : ""} reprovado{rejectedCount > 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              Verifique o motivo e reenvie o documento corrigido.
            </p>
          </div>
        </div>
      )}

      {/* Grupos de documentos */}
      {GROUPS.map(group => {
        const groupDocs = data.docs.filter(d => DOC_META[d.code].group === group);
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
              <DocCard
                key={doc.code}
                doc={doc}
                municipioId={municipioId}
                onRefresh={fetchData}
              />
            ))}
          </section>
        );
      })}

      <p className="text-center text-xs text-slate-400 pt-2">
        Decreto 24.288/2025 · SEMARH — Estado do Piauí
      </p>
    </div>
  );
}
