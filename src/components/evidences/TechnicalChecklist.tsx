"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

interface TechnicalChecklistProps {
  evidenceId: string;

  initialValues?: {
    hasDate?: boolean | null;
    dateIsInPeriod?: boolean | null;
    hasGeotag?: boolean | null;
    isPdfSearchable?: boolean | null;
    hasElectronicSignature?: boolean | null;
    followsAnnexII?: boolean | null;
    isOriginalDoc?: boolean | null;
  };
}

export function TechnicalChecklist({
  evidenceId,
  initialValues,
}: TechnicalChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    hasDate: initialValues?.hasDate ?? false,
    dateIsInPeriod: initialValues?.dateIsInPeriod ?? false,
    hasGeotag: initialValues?.hasGeotag ?? false,
    isPdfSearchable: initialValues?.isPdfSearchable ?? false,
    hasElectronicSignature:
      initialValues?.hasElectronicSignature ?? false,
    followsAnnexII: initialValues?.followsAnnexII ?? false,
    isOriginalDoc: initialValues?.isOriginalDoc ?? false,
  });

  function updateField(name: string, value: boolean) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSave() {
    startTransition(async () => {
      await fetch(`/api/evidences/${evidenceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "validate",
          ...form,
        }),
      });

      router.refresh();
    });
  }

  const fields = [
    ["hasDate", "Possui data"],
    ["dateIsInPeriod", "Data está no período válido"],
    ["hasGeotag", "Possui geolocalização"],
    ["isPdfSearchable", "PDF pesquisável"],
    ["hasElectronicSignature", "Assinatura eletrônica"],
    ["followsAnnexII", "Segue Anexo II"],
    ["isOriginalDoc", "Documento original"],
  ] as const;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <h3 className="font-semibold text-sm text-slate-700">
          Checklist técnico
        </h3>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={Boolean(form[key])}
              onChange={(e) => updateField(key, e.target.checked)}
              className="w-4 h-4"
            />

            <span className="text-sm text-slate-700">
              {label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}

          Salvar checklist
        </button>
      </div>
    </div>
  );
}