// src/components/evidences/ReturnModal.tsx
"use client";

import { useState } from "react";
import { X, Loader2, RotateCcw } from "lucide-react";

interface Props {
  evidenceId: string;
  fileName: string;
  onClose: () => void;
  onReturned: () => void;
}

export default function ReturnModal({ evidenceId, fileName, onClose, onReturned }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReturn() {
    if (!reason.trim()) {
      setError("Informe o motivo da devolução.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/evidences/${evidenceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "return", reason }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error ?? "Erro ao devolver evidência.");
      return;
    }

    onReturned();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-surface-900">Devolver evidência</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs text-surface-500 mb-0.5">Arquivo</p>
            <p className="text-sm font-medium text-surface-800 truncate">{fileName}</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">Motivo da devolução</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Descreva o problema encontrado e o que precisa ser corrigido..."
              autoFocus
            />
            <p className="text-xs text-surface-400 mt-1">
              O funcionário responsável receberá um email com este motivo.
            </p>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-surface-100">
          <button
            onClick={handleReturn}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Devolvendo..." : "Devolver para revisão"}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
