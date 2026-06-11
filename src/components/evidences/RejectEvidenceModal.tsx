"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface RejectEvidenceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function RejectEvidenceModal({
  open,
  onClose,
  onConfirm,
}: RejectEvidenceModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!reason.trim()) return;

    try {
      setLoading(true);
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white/95 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.18)] border border-white/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-slate-800">
              Rejeitar evidência
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <label className="text-sm font-semibold text-slate-700">
            Motivo da rejeição *
          </label>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="Descreva o motivo da rejeição..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
          />

          <p className="text-xs text-slate-400">
            O funcionário receberá esse comentário por e-mail.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            disabled={!reason.trim() || loading}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Rejeitar
          </button>
        </div>
      </div>
    </div>
  );
}