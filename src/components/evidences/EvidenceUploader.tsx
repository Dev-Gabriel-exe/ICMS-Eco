// src/components/evidences/EvidenceUploader.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/r2";
import type { Evidence } from "@/types";

interface Props {
  checklistItemId?: string;
  criteriaId: string;
  municipalityId: string;
  certameId: string;
  existingEvidences: Partial<Evidence>[];
}

interface UploadState {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export default function EvidenceUploader({
  checklistItemId,
  criteriaId,
  municipalityId,
  certameId,
  existingEvidences,
}: Props) {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [evidences, setEvidences] = useState<Partial<Evidence>[]>(existingEvidences);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const newUploads = accepted.map((f) => ({ file: f, status: "pending" as const }));
      setUploads((prev) => [...prev, ...newUploads]);

      for (const up of newUploads) {
        await uploadFile(up.file);
      }
    },
    [checklistItemId, criteriaId, municipalityId, certameId]
  );

  async function uploadFile(file: File) {
    setUploads((prev) =>
      prev.map((u) => (u.file === file ? { ...u, status: "uploading" } : u))
    );

    try {
      // 1. Gera URL presignada
      const presignRes = await fetch("/api/evidences/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          municipalityId,
          criteriaId,
          fileName: file.name,
          fileType: file.type,
          fileSizeBytes: file.size,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error(presignData.error);

      const { presignedUrl, fileKey } = presignData.data;

      // 2. Upload direto para R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Falha no upload para o R2");

      // 3. Constrói a URL pública
      const fileUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileKey}`;

      // 4. Registra no banco (precisa de checklistItemId criado antes ou cria junto)
      // Se não houver checklistItemId ainda, salvar via checklist primeiro
      let itemId = checklistItemId;
      if (!itemId) {
        const checkRes = await fetch("/api/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ municipalityId, certameId, criteriaId, status: "in_progress" }),
        });
        const checkData = await checkRes.json();
        itemId = checkData.data?.id;
      }

      if (!itemId) throw new Error("Não foi possível obter o item do checklist");

      const evRes = await fetch("/api/evidences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistItemId: itemId,
          fileName: file.name,
          fileUrl,
          fileKey,
          fileSizeBytes: file.size,
          fileType: file.type,
        }),
      });

      const evData = await evRes.json();
      if (!evData.success) throw new Error(evData.error);

      setEvidences((prev) => [...prev, evData.data]);
      setUploads((prev) =>
        prev.map((u) => (u.file === file ? { ...u, status: "done" } : u))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      setUploads((prev) =>
        prev.map((u) => (u.file === file ? { ...u, status: "error", error: msg } : u))
      );
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  return (
    <div className="space-y-3">
      {/* Evidências existentes */}
      {evidences.length > 0 && (
        <div className="space-y-2">
          {evidences.map((ev, i) => (
            <div key={ev.id ?? i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
              <span className="text-lg">{getFileIcon(ev.fileType ?? null)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-800 truncate">{ev.fileName}</p>
                <p className="text-xs text-surface-400">{formatFileSize(ev.fileSizeBytes ?? null)}</p>
              </div>
              {ev.fileUrl && (
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 text-xs font-medium hover:text-brand-700 shrink-0"
                >
                  Ver
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploads em progresso */}
      {uploads.filter((u) => u.status !== "done").map((up, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg border border-surface-200">
          <span className="text-lg">{getFileIcon(up.file.type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-800 truncate">{up.file.name}</p>
            <p className="text-xs text-surface-400">{formatFileSize(up.file.size)}</p>
          </div>
          {up.status === "uploading" && <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />}
          {up.status === "error" && (
            <span className="text-xs text-red-600 shrink-0">{up.error}</span>
          )}
        </div>
      ))}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive
            ? "border-brand-400 bg-brand-50"
            : "border-surface-300 hover:border-brand-400 hover:bg-surface-50"
          }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-6 h-6 text-surface-400 mx-auto mb-2" />
        <p className="text-sm text-surface-600">
          {isDragActive ? "Solte os arquivos aqui" : "Arraste arquivos ou clique para selecionar"}
        </p>
        <p className="text-xs text-surface-400 mt-1">
          PDF, JPG, PNG, WEBP · máx. {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
        </p>
      </div>
    </div>
  );
}
