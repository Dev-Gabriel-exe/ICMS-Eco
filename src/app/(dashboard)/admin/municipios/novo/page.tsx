"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, ChevronDown, Search, X,
  MapPin, CheckCircle2, AlertTriangle, Users,
  Building2, Hash, Sparkles, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IBGEState { id: number; sigla: string; nome: string; }
interface IBGEMunicipality { id: number; nome: string; }

// ─── Step indicator ──────────────────────────

function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
        done && "bg-emerald-500 text-white scale-95",
        active && "bg-emerald-600 text-white ring-4 ring-emerald-200 scale-110",
        !done && !active && "bg-slate-100 text-slate-400 border border-slate-200",
      )}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span className={cn(
        "text-[10px] font-medium tracking-wide",
        active ? "text-emerald-700" : "text-slate-400",
      )}>
        {label}
      </span>
    </div>
  );
}

function StepLine({ done }: { done: boolean }) {
  return (
    <div className="flex-1 h-0.5 mb-5 mx-1 rounded-full overflow-hidden bg-slate-100">
      <div
        className="h-full bg-emerald-400 transition-all duration-500 ease-out"
        style={{ width: done ? "100%" : "0%" }}
      />
    </div>
  );
}

// ─── Portal Dropdown ─────────────────────────
// Renderiza o dropdown via portal no body — nunca afetado por overflow pai

interface PortalDropdownProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  filtered: { label: string; value: string }[];
  value: string;
  query: string;
  highlighted: number;
  onSelect: (opt: { label: string; value: string }) => void;
  onHighlight: (i: number) => void;
}

function PortalDropdown({
  anchorRef, open, filtered, value, query,
  highlighted, onSelect, onHighlight,
}: PortalDropdownProps) {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    function updateCoords() {
      if (!anchorRef.current) return;
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }

    updateCoords();
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [open, anchorRef]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        width: coords.width,
        zIndex: 99999,
        borderRadius: "16px",
        border: "2px solid #a7f3d0",
        background: "#ffffff",
        boxShadow: "0 8px 32px rgba(5,150,105,0.14), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      {query && (
        <div style={{
          padding: "6px 16px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>
            {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div style={{ maxHeight: 220, overflowY: "auto", overscrollBehavior: "contain" }}>
        {filtered.length === 0 ? (
          <div style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "#94a3b8",
            fontSize: 13,
          }}>
            Nenhum resultado para "{query}"
          </div>
        ) : (
          filtered.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              onMouseEnter={() => onHighlight(i)}
              onMouseDown={(e) => { e.preventDefault(); onSelect(opt); }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 16px",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                border: "none",
                background:
                  opt.value === value
                    ? "#10b981"
                    : highlighted === i
                      ? "#ecfdf5"
                      : "#ffffff",
                color:
                  opt.value === value
                    ? "#ffffff"
                    : highlighted === i
                      ? "#065f46"
                      : "#334155",
                fontWeight: opt.value === value ? 600 : 400,
                transition: "background 0.08s",
              }}
            >
              {opt.value === value && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {opt.label}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}

// ─── Combobox ────────────────────────────────

interface ComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string, label: string) => void;
  onClear?: () => void;
  loading?: boolean;
  disabled?: boolean;
  hint?: string;
  icon?: React.ReactNode;
}

function Combobox({
  label, placeholder, value, options, onChange, onClear,
  loading = false, disabled = false, hint, icon,
}: ComboboxProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        // also check if click is inside portal dropdown
        const portal = document.getElementById("combobox-portal-root");
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
        if (!options.find((o) => o.label === query)) setQuery(value);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [query, value, options]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleSelect(opt: { label: string; value: string }) {
    setQuery(opt.label);
    onChange(opt.value, opt.label);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    onChange("", "");
    onClear?.();
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
  }

  const isSelected = !!value;

  return (
    <div ref={wrapRef} className="relative">
      <label className={cn(
        "block text-xs font-semibold uppercase tracking-widest mb-2 transition-colors duration-200 flex items-center gap-1.5",
        isSelected ? "text-emerald-600" : "text-slate-400",
      )}>
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
        {isSelected && <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />}
      </label>

      <div className="relative">
        <Search className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200",
          open ? "text-emerald-500" : "text-slate-300",
        )} />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlighted(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // pequeno delay para permitir o mousedown do item do portal
            setTimeout(() => {
              if (!options.find((o) => o.label === query)) setQuery(value);
              setOpen(false);
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Selecione o estado primeiro" : placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "w-full pl-10 pr-10 py-3 rounded-xl border-2 text-slate-800 text-sm bg-white",
            "placeholder:text-slate-300 focus:outline-none transition-all duration-200",
            disabled
              ? "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50"
              : isSelected
                ? "border-emerald-400 bg-emerald-50/30"
                : open
                  ? "border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]"
                  : "border-slate-200 hover:border-emerald-300",
          )}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-400 transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className={cn(
              "w-4 h-4 text-slate-300 transition-transform duration-200",
              open && "rotate-180 text-emerald-500",
            )} />
          )}
        </div>
      </div>

      {/* Portal dropdown — fora de qualquer overflow */}
      <PortalDropdown
        anchorRef={wrapRef}
        open={open && !disabled}
        filtered={filtered}
        value={value}
        query={query}
        highlighted={highlighted}
        onSelect={handleSelect}
        onHighlight={setHighlighted}
      />

      {hint && (
        <p className={cn(
          "text-xs mt-1.5 flex items-center gap-1 transition-all duration-300",
          value ? "text-emerald-600" : "text-slate-400",
        )}>
          {value && <CheckCircle2 className="w-3 h-3 shrink-0" />}
          {hint}
        </p>
      )}
    </div>
  );
}

// ─── Population input ─────────────────────────

function PopulationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);

  const brackets = [
    { max: 5_000, label: "Até 5 mil hab.", color: "bg-emerald-100 text-emerald-700" },
    { max: 10_000, label: "Até 10 mil hab.", color: "bg-teal-100 text-teal-700" },
    { max: 50_000, label: "Até 50 mil hab.", color: "bg-blue-100 text-blue-700" },
    { max: 100_000, label: "Até 100 mil hab.", color: "bg-indigo-100 text-indigo-700" },
    { max: Infinity, label: "Acima de 100 mil", color: "bg-purple-100 text-purple-700" },
  ];

  const bracket = value ? brackets.find(b => Number(value) <= b.max) : null;

  return (
    <div>
      <label className={cn(
        "block text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5 transition-colors duration-200",
        value ? "text-emerald-600" : "text-slate-400",
      )}>
        <Users className="w-3.5 h-3.5" />
        População estimada
        {bracket && (
          <span className={cn("ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold", bracket.color)}>
            {bracket.label}
          </span>
        )}
      </label>

      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ex: 15000"
          required
          min={1}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 text-slate-800 text-sm bg-white",
            "placeholder:text-slate-300 focus:outline-none transition-all duration-200",
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
            value
              ? "border-emerald-400 bg-emerald-50/30"
              : focused
                ? "border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]"
                : "border-slate-200 hover:border-emerald-300",
          )}
        />
        {value && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-medium pointer-events-none">
            hab.
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        {[5000, 10000, 25000, 50000, 100000].map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(String(v))}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all duration-150",
              value === String(v)
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600",
            )}
          >
            {v >= 1000 ? `${v / 1000}k` : v}
          </button>
        ))}
        <span className="text-[11px] text-slate-300 flex items-center pl-1">ou digite</span>
      </div>

      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Usado para calcular faixas do critério C.5 (plantio de mudas).
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────

export default function NovoMunicipioPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", population: "", ibgeCode: "", stateSigla: "", stateName: "",
  });
  const [states, setStates] = useState<IBGEState[]>([]);
  const [municipalities, setMunicipalities] = useState<IBGEMunicipality[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const currentStep = !form.stateSigla ? 1 : !form.name ? 2 : !form.population ? 3 : 4;

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then(r => r.json())
      .then((data: IBGEState[]) => { setStates(data); setLoadingStates(false); })
      .catch(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    if (!form.stateSigla) { setMunicipalities([]); return; }
    setLoadingMunicipalities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${form.stateSigla}/municipios?orderBy=nome`)
      .then(r => r.json())
      .then((data: IBGEMunicipality[]) => { setMunicipalities(data); setLoadingMunicipalities(false); })
      .catch(() => setLoadingMunicipalities(false));
  }, [form.stateSigla]);

  const stateOptions = states.map(s => ({ label: `${s.sigla} — ${s.nome}`, value: s.sigla }));
  const municipalityOptions = municipalities.map(m => ({ label: m.nome, value: String(m.id) }));

  function handleStateChange(sigla: string, label: string) {
    const stateName = label.split(" — ")[1] ?? "";
    setForm(f => ({ ...f, stateSigla: sigla, stateName, name: "", ibgeCode: "" }));
  }

  function handleMunicipalityChange(ibgeId: string, name: string) {
    setForm(f => ({ ...f, name, ibgeCode: ibgeId }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { setError("Selecione ou digite o nome do município."); return; }
    if (!form.population) { setError("Informe a população estimada."); return; }

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/municipalities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        population: Number(form.population),
        ibgeCode: form.ibgeCode || null,
        state: form.stateSigla || null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!data.success) { setError(data.error ?? "Erro ao criar município."); return; }
    setSubmitted(true);
    setTimeout(() => router.push("/admin/municipios"), 1800);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center p-6">
        <div className="text-center space-y-4" style={{ animation: "fadeSlideUp 0.5s ease both" }}>
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Município criado!</h2>
          <p className="text-slate-500">
            <strong className="text-emerald-700">{form.name}</strong> foi adicionado com sucesso.
          </p>
          <p className="text-xs text-slate-400">Redirecionando…</p>
        </div>
        <style jsx>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] p-6 md:p-10">
      <div
        className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-30"
        style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20"
        style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }}
      />

      <div className="relative max-w-lg mx-auto">

        <Link
          href="/admin/municipios"
          className="inline-flex items-center gap-2 text-sm text-emerald-700/60 hover:text-emerald-700 mb-8 group transition-colors duration-200"
          style={{ animation: "fadeSlideUp 0.3s ease both" }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Municípios
        </Link>

        <div className="flex items-center gap-4 mb-8" style={{ animation: "fadeSlideUp 0.38s ease both", animationDelay: "40ms" }}>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: "linear-gradient(135deg, #059669 0%, #34d399 100%)" }}
          >
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Novo município</h1>
            <p className="text-sm text-slate-400 mt-0.5">Cadastro vinculado ao IBGE · SEMARH-PI</p>
          </div>
        </div>

        <div className="flex items-center mb-8" style={{ animation: "fadeSlideUp 0.42s ease both", animationDelay: "80ms" }}>
          <StepDot step={1} current={currentStep} label="Estado" />
          <StepLine done={currentStep > 1} />
          <StepDot step={2} current={currentStep} label="Município" />
          <StepLine done={currentStep > 2} />
          <StepDot step={3} current={currentStep} label="População" />
          <StepLine done={currentStep > 3} />
          <StepDot step={4} current={currentStep} label="Revisar" />
        </div>

        {error && (
          <div
            className="mb-5 p-4 rounded-2xl border-2 border-red-200 bg-red-50 flex items-start gap-3"
            style={{ animation: "fadeSlideUp 0.25s ease both" }}
          >
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
            <button type="button" onClick={() => setError("")} className="text-red-400 hover:text-red-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card — sem overflow:hidden para não cortar dropdowns */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white border border-slate-200/80 shadow-sm"
          style={{ animation: "fadeSlideUp 0.48s ease both", animationDelay: "120ms" }}
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5 rounded-t-3xl bg-gradient-to-r from-emerald-50 to-white">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Dados do município</span>
            <span className="ml-auto text-xs text-slate-400">Passo {Math.min(currentStep, 4)} de 4</span>
          </div>

          <div className="p-6 space-y-6">

            <div style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "180ms" }}>
              <Combobox
                label="Estado"
                placeholder="Buscar estado..."
                value={form.stateSigla}
                options={stateOptions}
                onChange={handleStateChange}
                onClear={() => setForm(f => ({ ...f, stateSigla: "", stateName: "", name: "", ibgeCode: "" }))}
                loading={loadingStates}
                icon={<MapPin className="w-3 h-3" />}
              />
            </div>

            <div style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "210ms" }}>
              <Combobox
                label="Município"
                placeholder="Buscar município..."
                value={form.name}
                options={municipalityOptions}
                onChange={handleMunicipalityChange}
                onClear={() => setForm(f => ({ ...f, name: "", ibgeCode: "" }))}
                loading={loadingMunicipalities}
                disabled={!form.stateSigla}
                icon={<Building2 className="w-3 h-3" />}
                hint={
                  form.ibgeCode
                    ? `Código IBGE: ${form.ibgeCode}`
                    : "Selecione da lista para preencher o código IBGE automaticamente"
                }
              />
            </div>

            {form.ibgeCode && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100"
                style={{ animation: "fadeSlideUp 0.3s ease both" }}
              >
                <Hash className="w-4 h-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Código IBGE</p>
                  <p className="text-sm font-bold text-slate-700 font-mono">{form.ibgeCode}</p>
                </div>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Verificado
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap px-1">Dados complementares</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            <div style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "240ms" }}>
              <PopulationInput value={form.population} onChange={(v) => setForm(f => ({ ...f, population: v }))} />
            </div>

            {form.name && form.stateSigla && form.population && (
              <div
                className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-4"
                style={{ animation: "fadeSlideUp 0.3s ease both" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Resumo do cadastro</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Município", value: form.name },
                    { label: "Estado", value: form.stateName || form.stateSigla },
                    { label: "IBGE", value: form.ibgeCode || "—" },
                    { label: "População", value: `${Number(form.population).toLocaleString("pt-BR")} hab.` },
                  ].map(item => (
                    <div key={item.label} className="bg-white/70 rounded-xl p-3 border border-emerald-100">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{item.label}</p>
                      <p className="text-sm font-bold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1" style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "280ms" }}>
              <button
                type="submit"
                disabled={submitting || !form.name || !form.population}
                className={cn(
                  "flex-1 py-3.5 px-5 rounded-xl text-sm font-bold text-white",
                  "transition-all duration-200 flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                  "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                )}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: (!submitting && form.name && form.population)
                    ? "0 4px 20px -4px rgba(5,150,105,0.5)"
                    : "none",
                }}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Criando município…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Criar município <ChevronRight className="w-4 h-4 ml-auto" /></>
                )}
              </button>

              <Link
                href="/admin/municipios"
                className="px-5 py-3.5 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-500
                           bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-200
                           hover:-translate-y-0.5 active:scale-[0.98] flex items-center"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </form>

        <p
          className="text-center text-xs text-slate-400 mt-5"
          style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: "360ms" }}
        >
          Decreto 24.288/2025 · SEMARH-PI
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}