// src/components/scoring/ScoreSummary.tsx
import type { MunicipalityScore } from "@/types";
import AxisProgressBar from "./AxisProgressBar";
import SeloEstimado from "./SeloEstimado";
import { CheckCircle2, XCircle } from "lucide-react";

interface Props {
  score: MunicipalityScore;
  certameYear?: number;
}

export default function ScoreSummary({ score, certameYear = 2027 }: Props) {
  return (
    <div className="space-y-6">
      {/* Resumo top */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-surface-900">{score.totalPoints}</div>
          <div className="text-xs text-surface-500 mt-1">Pontos totais</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-surface-900">{score.criteriaMet} / 9</div>
          <div className="text-xs text-surface-500 mt-1">Critérios atingidos</div>
        </div>
        <div className="card p-4 flex items-center justify-center">
          <SeloEstimado
            selo={score.seloEstimado}
            criteriaMet={score.criteriaMet}
            a1Compliant={score.a1Compliant}
            certameYear={certameYear}
            size="md"
          />
        </div>
      </div>

      {/* Status A.1 */}
      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm
        ${score.a1Compliant
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"
        }`}>
        {score.a1Compliant ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 shrink-0" />
        )}
        <span>
          A.1 (aterro sanitário):{" "}
          <strong>{score.a1Compliant ? "comprovado" : "não comprovado"}</strong>
          {!score.a1Compliant && certameYear >= 2027 &&
            " — obrigatório para Selo A a partir de 2027 (art. 8°)"}
        </span>
      </div>

      {/* Barras por eixo */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-surface-800">Pontuação por eixo</h3>
          <span className="text-xs text-surface-400">mínimo 50 pts por eixo</span>
        </div>
        <div className="card-body space-y-4">
          {score.axes.map((axis) => (
            <AxisProgressBar key={axis.axis} axis={axis} />
          ))}
        </div>
      </div>
    </div>
  );
}
