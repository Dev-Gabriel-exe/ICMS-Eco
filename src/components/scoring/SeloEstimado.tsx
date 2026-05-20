// src/components/scoring/SeloEstimado.tsx
import type { SeloCategory } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  selo: SeloCategory;
  criteriaMet: number;
  a1Compliant: boolean;
  certameYear?: number;
  size?: "sm" | "md" | "lg";
}

export default function SeloEstimado({
  selo,
  criteriaMet,
  a1Compliant,
  certameYear = 2027,
  size = "md",
}: Props) {
  const showBarrierWarning = certameYear >= 2027 && criteriaMet >= 6 && !a1Compliant;

  const seloConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    A: { label: "Selo A", bg: "bg-green-600", text: "text-white", border: "border-green-700" },
    B: { label: "Selo B", bg: "bg-blue-600", text: "text-white", border: "border-blue-700" },
    C: { label: "Selo C", bg: "bg-amber-500", text: "text-white", border: "border-amber-600" },
    none: { label: "Inelegível", bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  };

  const sizeCls = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-5 py-2.5 text-lg",
  };

  const key = selo ?? "none";
  const cfg = seloConfig[key];

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg font-bold border",
          cfg.bg, cfg.text, cfg.border, sizeCls[size]
        )}
      >
        {selo ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : (
          <AlertTriangle className="w-3.5 h-3.5" />
        )}
        {showBarrierWarning && selo === null ? "B5 (sem A.1)" : cfg.label}
      </div>

      {showBarrierWarning && (
        <div className="flex items-start gap-1.5 max-w-xs">
          <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Sem A.1 comprovado → enquadrado como <strong>Selo B5</strong> (art. 8°)
          </p>
        </div>
      )}
    </div>
  );
}
