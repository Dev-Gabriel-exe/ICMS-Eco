// src/components/checklist/AxisCard.tsx
"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, ChevronRight, FileText } from "lucide-react";
import type { AxisScore } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  axis: AxisScore;
  municipioId: string;
  certameId?: string;
}

export default function AxisCard({ axis, municipioId }: Props) {
  const isComplete = axis.criteriaMet;
  const isWarning = !isComplete && axis.progress >= 25;
  const isDanger = !isComplete && axis.progress < 25;

  const borderColor = isComplete
    ? "border-green-200"
    : isWarning
    ? "border-amber-200"
    : "border-surface-200";

  const bgHeader = isComplete
    ? "bg-green-50"
    : isWarning
    ? "bg-amber-50"
    : "bg-surface-50";

  const axisColor = isComplete
    ? "bg-green-600 text-white"
    : isWarning
    ? "bg-amber-500 text-white"
    : "bg-surface-300 text-surface-700";

  const pointsColor = isComplete
    ? "text-green-700"
    : isWarning
    ? "text-amber-700"
    : "text-red-600";

  const barColor = isComplete
    ? "bg-green-500"
    : isWarning
    ? "bg-amber-400"
    : "bg-red-400";

  const missing = Math.max(0, 50 - axis.points);

  return (
    <Link
      href={`/municipio/${municipioId}/checklist/${axis.axis}`}
      className={cn(
        "block rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group",
        borderColor
      )}
    >
      {/* Header */}
      <div className={cn("px-4 py-3 flex items-center justify-between", bgHeader)}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center shrink-0",
              axisColor
            )}
          >
            {axis.axis}
          </span>
          <div>
            <p className="text-xs font-semibold text-surface-800 leading-tight line-clamp-1">
              {axis.axisName}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">
              {axis.itemsComplete} de {axis.itemsTotal} itens concluídos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertTriangle
              className={cn(
                "w-4 h-4",
                isWarning ? "text-amber-500" : "text-red-400"
              )}
            />
          )}
          <ChevronRight className="w-4 h-4 text-surface-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {/* Pontuação */}
        <div className="flex items-end justify-between">
          <div>
            <span className={cn("text-2xl font-bold", pointsColor)}>
              {axis.points}
            </span>
            <span className="text-xs text-surface-400 ml-1">
              / {axis.maxPoints} pts
            </span>
          </div>

          {isComplete ? (
            <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded-md px-2 py-0.5">
              Critério atingido ✓
            </span>
          ) : (
            <span className="text-xs text-surface-500">
              Faltam{" "}
              <strong className={cn(isDanger ? "text-red-600" : "text-amber-700")}>
                {missing} pts
              </strong>{" "}
              p/ critério
            </span>
          )}
        </div>

        {/* Barra de progresso */}
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", barColor)}
            style={{ width: `${Math.min(axis.progress, 100)}%` }}
          />
        </div>

        {/* Progresso para mínimo de 50 pts */}
        <div className="flex items-center justify-between text-xs text-surface-400">
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{axis.progress}% do máximo</span>
          </div>
          {/* Marcador de 50 pts mínimos */}
          <span className="text-surface-300">mín. 50 pts</span>
        </div>
      </div>
    </Link>
  );
}