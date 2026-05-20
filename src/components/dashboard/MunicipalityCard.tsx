// src/components/dashboard/MunicipalityCard.tsx
import Link from "next/link";
import { Building2, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatPopulation, cn } from "@/lib/utils";
import type { MunicipalityScore } from "@/types";

interface Props {
  municipality: {
    id: string;
    name: string;
    population: number;
    ibgeCode?: string | null;
  };
  score?: MunicipalityScore;
}

export default function MunicipalityCard({ municipality, score }: Props) {
  const seloColors: Record<string, string> = {
    A: "text-green-700 bg-green-100",
    B: "text-blue-700 bg-blue-100",
    C: "text-amber-700 bg-amber-100",
  };

  return (
    <Link
      href={`/municipio/${municipality.id}`}
      className="card p-5 hover:shadow-md transition-all flex items-start gap-4"
    >
      <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5 text-brand-700" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-surface-800 truncate">{municipality.name}</h3>
          {score?.seloEstimado && (
            <span className={cn("badge ml-2 shrink-0 font-bold", seloColors[score.seloEstimado] ?? "badge-slate")}>
              Selo {score.seloEstimado}
            </span>
          )}
        </div>

        <p className="text-xs text-surface-400 mb-3">
          {formatPopulation(municipality.population)} hab.
          {municipality.ibgeCode && ` · ${municipality.ibgeCode}`}
        </p>

        {score && (
          <>
            {/* Progress */}
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  score.criteriaMet >= 6
                    ? "bg-green-500"
                    : score.criteriaMet >= 3
                    ? "bg-amber-500"
                    : "bg-red-400"
                )}
                style={{ width: `${(score.criteriaMet / 9) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-surface-500">
              <span>{score.criteriaMet} / 9 critérios</span>
              <span>{score.totalPoints} pts</span>
            </div>

            {/* Alertas */}
            {!score.a1Compliant && score.criteriaMet >= 6 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                <span>A.1 não comprovado — risco Selo B5</span>
              </div>
            )}
          </>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-surface-300 mt-1 shrink-0" />
    </Link>
  );
}
