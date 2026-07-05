"use client";

import { Download } from "lucide-react";

export function ExportDocButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-150 no-print"
    >
      <Download className="w-3.5 h-3.5" />
      Exportar .docx
    </a>
  );
}
