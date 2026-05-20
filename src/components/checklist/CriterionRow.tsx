// src/components/checklist/CriterionRow.tsx
"use client";
import { calculateItemPoints } from "@/lib/scoring";
import type { ChecklistItem, Criteria } from "@/types";
import { cn } from "@/lib/utils";
import EvidenceUploader from "@/components/evidences/EvidenceUploader";

interface Props {
  criterion: Criteria;
  item?: ChecklistItem;
  municipalityId: string;
  certameId: string;
  population: number;
}

export default function CriterionRow({ criterion, item, municipalityId, certameId, population }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<ChecklistItem["status"]>(item?.status ?? "not_started");
  const [quantity, setQuantity] = useState<number | null>(item?.quantity ?? null);
  const [percentageValue, setPercentageValue] = useState<number | null>(
    item?.percentageValue != null ? Number(item.percentageValue) : null
  );
  const [faixaLevel, setFaixaLevel] = useState<number | null>(item?.faixaLevel ?? null);
  const [mapLink, setMapLink] = useState(item?.mapLink ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Calcula pontos em tempo real
  const fakeItem = { status, quantity, percentageValue, faixaLevel } as unknown as ChecklistItem;
  const points = calculateItemPoints(fakeItem, criterion, population);

  async function save() {
    setSaving(true);
    await fetch("/api/checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        municipalityId,
        certameId,
        criteriaId: criterion.id,
        status,
        quantity,
        percentageValue,
        faixaLevel,
        mapLink: mapLink || null,
        notes: notes || null,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const statusColors: Record<ChecklistItem["status"], string> = {
    complete: "border-green-200 bg-green-50",
    in_progress: "border-amber-200 bg-amber-50",
    not_started: "border-surface-200 bg-white",
    returned: "border-blue-200 bg-blue-50",
  };

  const statusLabels: Record<ChecklistItem["status"], string> = {
    complete: "Completo",
    in_progress: "Em andamento",
    not_started: "Não iniciado",
    returned: "Devolvido",
  };

  return (
    <div className={cn("card border transition-colors", statusColors[status])}>
      {/* Header da linha */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-700 shrink-0">
          {criterion.id}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-surface-800 truncate">{criterion.description}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-sm font-semibold",
                status === "complete" ? "text-green-700" : "text-surface-500"
              )}>
                {points} / {criterion.maxPoints} pts
              </span>
              <span className={cn("badge text-xs",
                status === "complete" ? "badge-green" :
                status === "in_progress" ? "badge-amber" :
                status === "returned" ? "badge-blue" : "badge-slate"
              )}>
                {statusLabels[status]}
              </span>
            </div>
          </div>
          {!expanded && <p className="text-xs text-surface-400 mt-0.5 truncate">{criterion.requirement}</p>}
        </div>

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-surface-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" />
        )}
      </button>

      {/* Expandido */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-4">
          {/* Requisito */}
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">Requisito</p>
            <p className="text-sm text-surface-700">{criterion.requirement}</p>
          </div>

          {/* Documentos exigidos */}
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Documentação comprobatória
            </p>
            <p className="text-sm text-blue-800">{criterion.requiredDocs}</p>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ChecklistItem["status"])}
              className="input"
            >
              <option value="not_started">Não iniciado</option>
              <option value="in_progress">Em andamento</option>
              <option value="complete">Completo</option>
            </select>
          </div>

          {/* Per unit */}
          {criterion.scoringType === "per_unit" && (
            <div>
              <label className="label">Quantidade</label>
              <input
                type="number"
                min={0}
                value={quantity ?? ""}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : null)}
                className="input"
                placeholder="Número de unidades"
              />
              {criterion.scoringConfig && "unitValue" in criterion.scoringConfig && (
                <p className="text-xs text-surface-400 mt-1">
                  {criterion.scoringConfig.unitValue} pts por unidade · máx {criterion.maxPoints} pts
                </p>
              )}
            </div>
          )}

          {/* Percentage (E.1) */}
          {criterion.scoringType === "percentage" && (
            <div>
              <label className="label">Cobertura (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentageValue ?? ""}
                onChange={(e) => setPercentageValue(e.target.value ? Number(e.target.value) : null)}
                className="input"
                placeholder="Ex: 75"
              />
              <p className="text-xs text-surface-400 mt-1">
                Pontos = % × 0,15 · máx {criterion.maxPoints} pts
              </p>
            </div>
          )}

          {/* Per faixa territory (H.1, H.3) */}
          {criterion.scoringType === "per_faixa" &&
            criterion.scoringConfig &&
            "type" in criterion.scoringConfig &&
            criterion.scoringConfig.type === "territory" && (
            <div>
              <label className="label">Percentual do território (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={percentageValue ?? ""}
                onChange={(e) => setPercentageValue(e.target.value ? Number(e.target.value) : null)}
                className="input"
                placeholder="Ex: 30"
              />
            </div>
          )}

          {/* Per faixa population (C.5) */}
          {criterion.scoringType === "per_faixa" &&
            criterion.scoringConfig &&
            "type" in criterion.scoringConfig &&
            criterion.scoringConfig.type === "population" && (
            <div>
              <label className="label">Nível de mudas comprovado</label>
              <select
                value={faixaLevel ?? ""}
                onChange={(e) => setFaixaLevel(e.target.value ? Number(e.target.value) : null)}
                className="input"
              >
                <option value="">Selecione o nível</option>
                <option value="1">Nível 1 (8 pts)</option>
                <option value="2">Nível 2 (12 pts)</option>
                <option value="3">Nível 3 (30 pts)</option>
              </select>
            </div>
          )}

          {/* Link de mapas (C.1) */}
          {criterion.hasMapLink && (
            <div>
              <label className="label">Link de mapas (SEMARH)</label>
              <input
                type="url"
                value={mapLink}
                onChange={(e) => setMapLink(e.target.value)}
                className="input"
                placeholder="https://..."
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="label">Observações internas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input resize-none"
              placeholder="Notas ou pendências..."
            />
          </div>

          {/* Pontos calculados */}
          <div className={cn(
            "flex items-center justify-between p-3 rounded-lg",
            points > 0 ? "bg-green-50 border border-green-200" : "bg-surface-50 border border-surface-200"
          )}>
            <span className="text-sm text-surface-600">Pontos calculados:</span>
            <span className={cn("text-lg font-bold", points > 0 ? "text-green-700" : "text-surface-400")}>
              {points} pts
            </span>
          </div>

          {/* Botão salvar */}
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar"}
            </button>
          </div>

          {/* Upload de evidências */}
          <div className="border-t border-surface-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4 text-surface-500" />
              <span className="text-sm font-semibold text-surface-700">Evidências</span>
              {item?.evidences && item.evidences.length > 0 && (
                <span className="badge badge-slate">{item.evidences.length} arquivo(s)</span>
              )}
            </div>
            <EvidenceUploader
              checklistItemId={item?.id}
              criteriaId={criterion.id}
              municipalityId={municipalityId}
              certameId={certameId}
              existingEvidences={item?.evidences ?? []}
            />
          </div>
        </div>
      )}
    </div>
  );
}
