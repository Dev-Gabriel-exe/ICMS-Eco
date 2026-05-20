// src/components/layout/Header.tsx
import { Bell } from "lucide-react";
import Link from "next/link";

interface Props {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function Header({ title, breadcrumbs }: Props) {
  return (
    <header className="h-14 border-b border-surface-200 bg-white flex items-center px-6 gap-4 sticky top-0 z-30">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-surface-300">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-surface-500 hover:text-surface-700 transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-surface-800 font-medium truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : (
        <h1 className="text-sm font-semibold text-surface-800 flex-1">{title}</h1>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <button className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 transition-colors relative">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
