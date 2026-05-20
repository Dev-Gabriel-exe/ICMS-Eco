// src/components/scoring/AxisProgressBar.tsx
import type { AxisScore } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface Props {
  axis: AxisScore;
  showDetails?: boolean;
}

export default function AxisProgressBar({ axis, showDetails = true }: Props) {
  const color = axis.criteriaMet
    ? "bg-green-500"
    : axis.progress >= 25
    ? "bg-amber-500"
    : "bg-red-400";

  const textColor = axis.criteriaMet
    ? "text-green-700"
    : axis.progress >= 25
    ? "text-amber-700"
    : "text-red-600";

  return (
    <div className="space-y-1">
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center",
                axis.criteriaMet ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"
              )}
            >
              {axis.axis}
            </span>
            <span className="text-surface-700 truncate max-w-[200px]">{axis.axisName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("font-semibold text-sm", textColor)}>
              {axis.points} / {axis.maxPoints}
            </span>
            {axis.criteriaMet ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
        </div>
      )}

      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(axis.progress, 100)}%` }}
        />
      </div>

      {showDetails && !axis.criteriaMet && (
        <p className="text-xs text-surface-400">
          Faltam {Math.max(0, 50 - axis.points)} pts para atingir o critério
        </p>
      )}
    </div>
  );
}
