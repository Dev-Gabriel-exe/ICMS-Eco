// src/app/(dashboard)/admin/atividades/AtividadesFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Filter, Download } from "lucide-react";

export function AtividadesFilters({
  from,
  to,
  total,
}: {
  from: string;
  to: string;
  total: number;
}) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const reportUrl =
    `/api/atividades/relatorio?` +
    (from ? `from=${from}&` : "") +
    (to   ? `to=${to}`      : "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
        <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-xs text-slate-500 font-medium">De</span>
        <input
          type="date"
          defaultValue={from}
          className="text-xs text-slate-700 border-none outline-none bg-transparent"
          onChange={e => update("from", e.target.value)}
        />
        <span className="text-xs text-slate-400">até</span>
        <input
          type="date"
          defaultValue={to}
          className="text-xs text-slate-700 border-none outline-none bg-transparent"
          onChange={e => update("to", e.target.value)}
        />
      </div>

      <a
        href={reportUrl}
        download
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700
                   text-white text-xs font-semibold transition-colors shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        Exportar .docx ({total})
      </a>
    </div>
  );
}