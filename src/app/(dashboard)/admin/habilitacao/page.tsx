// src/app/(dashboard)/admin/habilitacao/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Clock, XCircle, AlertCircle, Upload, FileText, Trash2, Eye } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type HabDocStatus = "not_started" | "pending" | "approved" | "rejected";

type HabDocCode =
  | "CONSELHO_CRIACAO"
  | "CONSELHO_ATA"
  | "SECRETARIA_CRIACAO"
  | "SECRETARIA_NOMEACAO"
  | "SECRETARIA_QUADRO"
  | "PLANO_DIRETOR";

interface HabFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  fileType: string | null;
  uploadedAt: string;
}

interface HabDoc {
  id: string;
  code: HabDocCode;
  status: HabDocStatus;
  rejectReason: string | null;
  validatedAt: string | null;
  files: HabFile[];
}

interface HabStatus {
  docs: HabDoc[];
  isHabilitado: boolean;
  certameId: string;
}

// ─── Config do documento ────────────────────────────────────────────────────

const DOC_META: Record<
  HabDocCode,
  { label: string; description: string; group: string; required: boolean }
> = {
  CONSELHO_CRIACAO: {
    label: "Lei/Decreto de Criação do Conselho",
    description:
      "Documento legal de criação do Conselho Municipal de Defesa do Meio Ambiente (lei ou decreto municipal publicado em diário oficial).",
    group: "Conselho Municipal de Defesa do Meio Ambiente",
    required: true,
  },
  CONSELHO_ATA: {
    label: "Ata de Reunião do Conselho",
    description:
      "Ata de reunião comprovando o regular funcionamento do Conselho Municipal de Defesa do Meio Ambiente no período.",
    group: "Conselho Municipal de Defesa do Meio Ambiente",
    required: true,
  },
  SECRETARIA_CRIACAO: {
    label: "Lei de Criação do Órgão Ambiental",
    description:
      "Instrumento legal de criação da Secretaria Municipal de Meio Ambiente ou órgão equivalente com competências legais específicas para proteção ambiental.",
    group: "Secretaria Municipal de Meio Ambiente",
    required: true,
  },
  SECRETARIA_NOMEACAO: {
    label: "Ato de Nomeação do Secretário/Técnicos",
    description:
      "Ato de nomeação do secretário e/ou técnicos responsáveis pelo órgão ambiental municipal.",
    group: "Secretaria Municipal de Meio Ambiente",
    required: true,
  },
  SECRETARIA_QUADRO: {
    label: "Comprovação do Quadro Mínimo de Profissionais",
    description:
      "Documentação que comprove a existência de quadro mínimo de profissionais responsáveis pelas atividades finalísticas do órgão ambiental (conforme Art. 15 do Decreto 24.288/2025).",
    group: "Secretaria Municipal de Meio Ambiente",
    required: true,
  },
  PLANO_DIRETOR: {
    label: "Plano Diretor com Capítulo Ambiental",
    description:
      "Cópia do Plano Diretor Municipal contendo o capítulo sobre política ambiental. Exigido apenas quando couber (municípios obrigados por lei federal).",
    group: "Plano Diretor Municipal",
    required: false,
  },
};

const GROUPS = [
  "Conselho Municipal de Defesa do Meio Ambiente",
  "Secretaria Municipal de Meio Ambiente",
  "Plano Diretor Municipal",
];

// ─── Badge de status ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: HabDocStatus | "habilitado" }) {
  const map: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    not_started: {
      label: "Não iniciado",
      color: "bg-gray-100 text-gray-600 border-gray-200",
      icon: <AlertCircle size={13} />,
    },
    pending: {
      label: "Pendente de análise",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: <Clock size={13} />,
    },
    approved: {
      label: "Aprovado",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: <CheckCircle size={13} />,
    },
    rejected: {
      label: "Reprovado",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle size={13} />,
    },
    habilitado: {
      label: "Habilitado",
      color: "bg-emerald-600 text-white border-emerald-600",
      icon: <CheckCircle size={13} />,
    },
  };

  const { label, color, icon } = map[status] ?? map.not_started;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}

// ─── Card de um documento ─────────────────────────────────────────────────────

function DocCard({
  doc,
  certameId,
  municipioId,
  onRefresh,
}: {
  doc: HabDoc;
  certameId: string;
  municipioId: string;
  onRefresh: () => void;
}) {
  const meta = DOC_META[doc.code];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canUpload = doc.status !== "approved";

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("certameId", certameId);
      formData.append("docCode", doc.code);

      const res = await fetch(`/api/habilitacao/${municipioId}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Erro ao enviar arquivo.");
      }

      onRefresh();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    if (!confirm("Deseja remover este arquivo?")) return;
    try {
      await fetch(`/api/habilitacao/${municipioId}/file/${fileId}`, {
        method: "DELETE",
      });
      onRefresh();
    } catch {
      alert("Erro ao remover arquivo.");
    }
  }

  function formatBytes(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={15} className="text-gray-400 flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-900">{meta.label}</h3>
            {!meta.required && (
              <span className="text-xs text-gray-400 font-normal">(quando couber)</span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{meta.description}</p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Motivo da reprovação */}
      {doc.status === "rejected" && doc.rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
          <span className="font-medium">Motivo da reprovação:</span> {doc.rejectReason}
        </div>
      )}

      {/* Arquivos enviados */}
      {doc.files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {doc.files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-700 font-medium truncate">{f.fileName}</span>
                {f.fileSizeBytes && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatBytes(f.fileSizeBytes)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={f.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Visualizar"
                >
                  <Eye size={13} />
                </a>
                {canUpload && (
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Área de upload */}
      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-3 px-4 text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={15} />
            {uploading ? "Enviando…" : doc.files.length > 0 ? "Adicionar outro arquivo" : "Clique para enviar arquivo"}
          </button>
          {uploadError && (
            <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Banner de status global ──────────────────────────────────────────────────

function HabilitacaoBanner({ docs, isHabilitado }: { docs: HabDoc[]; isHabilitado: boolean }) {
  if (isHabilitado) {
    return (
      <div className="bg-emerald-600 text-white rounded-xl px-5 py-4 flex items-center gap-3">
        <CheckCircle size={20} />
        <div>
          <p className="font-semibold text-sm">Município Habilitado</p>
          <p className="text-xs text-emerald-100">
            Todos os requisitos obrigatórios foram aprovados. O município está apto a participar do certame.
          </p>
        </div>
      </div>
    );
  }

  const total = docs.filter((d) => DOC_META[d.code].required).length;
  const approved = docs.filter((d) => DOC_META[d.code].required && d.status === "approved").length;
  const pending = docs.filter((d) => d.status === "pending").length;
  const rejected = docs.filter((d) => d.status === "rejected").length;
  const notStarted = docs.filter((d) => d.status === "not_started").length;

  let message = "";
  let colorClass = "";

  if (rejected > 0) {
    message = `${rejected} documento(s) reprovado(s). Corrija e reenvie para continuar.`;
    colorClass = "bg-red-50 border-red-200 text-red-800";
  } else if (pending > 0) {
    message = `${pending} documento(s) aguardando análise do administrador.`;
    colorClass = "bg-yellow-50 border-yellow-200 text-yellow-800";
  } else if (notStarted > 0) {
    message = `Envie os documentos obrigatórios para solicitar habilitação.`;
    colorClass = "bg-blue-50 border-blue-200 text-blue-800";
  } else {
    message = "Análise em andamento.";
    colorClass = "bg-gray-50 border-gray-200 text-gray-700";
  }

  return (
    <div className={`border rounded-xl px-5 py-4 flex items-start gap-3 ${colorClass}`}>
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">
          Habilitação — {approved}/{total} requisitos obrigatórios aprovados
        </p>
        <p className="text-xs mt-0.5">{message}</p>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function HabilitacaoPage() {
  const params = useParams();
  const municipioId = params?.municipioId as string;

  const [data, setData] = useState<HabStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/habilitacao/${municipioId}`);
      if (!res.ok) throw new Error("Erro ao carregar dados de habilitação.");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (municipioId) fetchData();
  }, [municipioId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Carregando habilitação…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-500">
        {error ?? "Não foi possível carregar os dados."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Título */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Habilitação para o Certame</h1>
        <p className="text-sm text-gray-500 mt-1">
          Envie os documentos exigidos pelo Art. 15 do Decreto nº 24.288/2025. A habilitação é
          pré-condição eliminatória — municípios não habilitados não pontuam.
        </p>
      </div>

      {/* Banner de status global */}
      <HabilitacaoBanner docs={data.docs} isHabilitado={data.isHabilitado} />

      {/* Grupos de documentos */}
      {GROUPS.map((group) => {
        const groupDocs = data.docs.filter((d) => DOC_META[d.code].group === group);
        if (groupDocs.length === 0) return null;

        return (
          <div key={group} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b border-gray-100 pb-2">
              {group}
            </h2>
            {groupDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                certameId={data.certameId}
                municipioId={municipioId}
                onRefresh={fetchData}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}