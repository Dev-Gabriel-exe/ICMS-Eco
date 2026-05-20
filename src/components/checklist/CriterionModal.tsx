// src/components/checklist/CriterionModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { X, FileText, Info, Loader2, ExternalLink } from "lucide-react";
import { calculateItemPoints } from "@/lib/scoring";
import type { ChecklistItem, Criteria } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  criterion: Criteria;
  item?: ChecklistItem;
  municipalityId: string;
  certameId: string;
  population: number;
  onClose: () => void;
  onSaved: (item: ChecklistItem) => void;
}

export default function CriterionModal({
  criterion,
  item,
  municipalityId,
  certameId,
  population,
  onClose,
  onSaved,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<ChecklistItem["status"]>(item?.status ?? "not_started");
  const [quantity, setQuantity] = useState<number | null>(item?.quantity ?? null);
  const [percentageValue, setPercentageValue] = useState<number | null>(
    item?.percentageValue != null ? Number(item.percentageValue) : null
  );
  const [faixaLevel, setFaixaLevel] = useState<number | null>(item?.faixaLevel ?? null);
  const [mapLink, setMapLink] = useState(item?.mapLink ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"fill" | "docs">("fill");

  // Fecha ao clicar fora
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Fecha com Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloqueia scroll do body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Pontos em tempo real
  const fakeItem = { status, quantity, percentageValue, faixaLevel } as unknown as ChecklistItem;
  const points = calculateItemPoints(fakeItem, criterion, population);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/checklist", {
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
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      onSaved(data.data as ChecklistItem);
      onClose();
    }
  }

  const statusLabels: Record<string, string> = {
    not_started: "Não iniciado",
    in_progress: "Em andamento",
    complete: "Completo",
    returned: "Devolvido",
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-surface-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
              {criterion.id}
            </div>
            <div>
              <h2 className="font-semibold text-surface-900 leading-tight">{criterion.description}</h2>
              <p className="text-xs text-surface-500 mt-0.5">
                Tipo: {criterion.scoringType} · máx {criterion.maxPoints} pts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-100 shrink-0">
          {(["fill", "docs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-b-2 border-brand-600 text-brand-700"
                  : "text-surface-500 hover:text-surface-700"
              )}
            >
              {tab === "fill" ? "Preenchimento" : "Documentação exigida"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {activeTab === "docs" ? (
            <div className="space-y-4">
              <div className="p-4 bg-surface-50 rounded-lg">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-2">
                  Requisito (texto do decreto)
                </p>
                <p className="text-sm text-surface-700 leading-relaxed">{criterion.requirement}</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Documentação comprobatória
                </p>
                <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-line">
                  {criterion.requiredDocs}
                </p>
              </div>
              {criterion.isReusable && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-800">
                    <strong>Documento permanente (art. 17):</strong> Este item pode ser comprovado com
                    documento de certame anterior — basta indicar a referência e o ano de aceite.
                  </p>
                </div>
              )}
              {criterion.validYears === 3 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">
                    <strong>Validade especial (art. 16 §3°):</strong> Os relatórios deste item podem
                    ser utilizados por até 3 anos.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Status */}
              <div>
                <label className="label">Status do item</label>
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
                      {(criterion.scoringConfig as { unitValue: number }).unitValue} pts/unidade ·
                      máx {criterion.maxPoints} pts
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
                    step={0.1}
                    value={percentageValue ?? ""}
                    onChange={(e) => setPercentageValue(e.target.value ? Number(e.target.value) : null)}
                    className="input"
                    placeholder="Ex: 75.5"
                  />
                  <p className="text-xs text-surface-400 mt-1">
                    Pontos = % × 0,15 · máx {criterion.maxPoints} pts ·
                    Estimado: <strong>{points} pts</strong>
                  </p>
                </div>
              )}

              {/* Per faixa territory */}
              {criterion.scoringType === "per_faixa" &&
                criterion.scoringConfig &&
                "type" in criterion.scoringConfig &&
                criterion.scoringConfig.type === "territory" && (
                <div>
                  <label className="label">Percentual do território com UC (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
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
                    <option value="1">Nível 1 — 8 pts</option>
                    <option value="2">Nível 2 — 12 pts</option>
                    <option value="3">Nível 3 — 30 pts (máximo)</option>
                  </select>
                  <p className="text-xs text-surface-400 mt-1">
                    Ver tabela C.5 na aba "Documentação exigida"
                  </p>
                </div>
              )}

              {/* Link de mapas C.1 */}
              {criterion.hasMapLink && (
                <div>
                  <label className="label flex items-center gap-1.5">
                    Link de mapas (SEMARH)
                    <ExternalLink className="w-3 h-3 text-surface-400" />
                  </label>
                  <input
                    type="url"
                    value={mapLink}
                    onChange={(e) => setMapLink(e.target.value)}
                    className="input"
                    placeholder="https://..."
                  />
                  <p className="text-xs text-surface-400 mt-1">
                    URL do relatório técnico do Índice de Redução de Desmatamento Ilegal
                  </p>
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="label">Observações internas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder="Pendências, contatos, referências..."
                />
              </div>

              {/* Preview de pontos */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                points > 0 ? "bg-green-50 border-green-200" : "bg-surface-50 border-surface-200"
              )}>
                <span className="text-sm text-surface-600">Pontos estimados com as informações atuais:</span>
                <span className={cn("text-xl font-bold", points > 0 ? "text-green-700" : "text-surface-400")}>
                  {points} pts
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-surface-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-surface-400">
            {criterion.id} · {statusLabels[status]}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}