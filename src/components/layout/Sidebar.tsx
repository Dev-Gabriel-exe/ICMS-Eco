// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Leaf,
  LayoutDashboard,
  Building2,
  Users,
  ChevronRight,
  LogOut,
  Settings,
  FileText,
  MapPin,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/types";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface SidebarProps {
  role: Role;
  userName: string;
  userEmail: string;
  municipalityId?: string;
  municipalityName?: string;
}

// ─────────────────────────────────────────────
// Navegação — Admin
// ─────────────────────────────────────────────

const ADMIN_NAV = [
  {
    label: "Painel Geral",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Municípios",
    href: "/admin/municipios",
    icon: Building2,
  },
  {
    label: "Usuários",
    href: "/admin/usuarios",
    icon: Users,
  },
];

// ─────────────────────────────────────────────
// Navegação — Município
// ─────────────────────────────────────────────

const MUNICIPALITY_AXES = [
  { axis: "A", label: "Resíduos Sólidos" },
  { axis: "B", label: "Educação Ambiental" },
  { axis: "C", label: "Desmatamento" },
  { axis: "D", label: "Queimadas e Solo" },
  { axis: "E", label: "Mananciais" },
  { axis: "F", label: "Controle da Poluição" },
  { axis: "G", label: "Edificações Irregulares" },
  { axis: "H", label: "Unidades de Conservação" },
  { axis: "I", label: "Legislação Ambiental" },
];

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export function Sidebar({
  role,
  userName,
  userEmail,
  municipalityId,
  municipalityName,
}: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-surface-900 border-r border-surface-800 flex flex-col">
      {/* ── Logo ── */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-surface-800 shrink-0">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
          <Leaf className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-white font-semibold text-sm leading-none">ICMS-ECO</div>
          <div className="text-surface-500 text-xs mt-0.5 truncate">
            {role === "admin" ? "Administrador" : "Gestão Municipal"}
          </div>
        </div>
      </div>

      {/* ── Navegação ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {role === "admin" ? (
          <>
            <NavSection label="Administração" />
            {ADMIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<item.icon className="w-4 h-4" />}
                active={isActive(item.href, item.exact)}
              />
            ))}

            <div className="mt-4">
              <NavSection label="Acesso Rápido" />
              <NavLink
                href="/admin/relatorios"
                label="Relatórios"
                icon={<FileText className="w-4 h-4" />}
                active={isActive("/admin/relatorios")}
              />
            </div>
          </>
        ) : municipalityId ? (
          <>
            {/* Link de volta ao painel do município */}
            <NavLink
              href={`/municipio/${municipalityId}`}
              label="Painel do Município"
              icon={<LayoutDashboard className="w-4 h-4" />}
              active={pathname === `/municipio/${municipalityId}`}
            />

            <div className="mt-4">
              <NavSection label="Checklist por Eixo" />
              {MUNICIPALITY_AXES.map(({ axis, label }) => (
                <NavLink
                  key={axis}
                  href={`/municipio/${municipalityId}/checklist/${axis}`}
                  label={`${axis} — ${label}`}
                  icon={
                    <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                      {axis}
                    </span>
                  }
                  active={isActive(`/municipio/${municipalityId}/checklist/${axis}`)}
                />
              ))}
            </div>

            <div className="mt-4">
              <NavSection label="Documentos" />
              <NavLink
                href={`/municipio/${municipalityId}/evidencias`}
                label="Evidências"
                icon={<FileText className="w-4 h-4" />}
                active={isActive(`/municipio/${municipalityId}/evidencias`)}
              />
              <NavLink
                href={`/municipio/${municipalityId}/relatorio`}
                label="Relatório PDF"
                icon={<FileText className="w-4 h-4" />}
                active={isActive(`/municipio/${municipalityId}/relatorio`)}
              />
            </div>
          </>
        ) : null}
      </nav>

      {/* ── Perfil e logout ── */}
      <div className="border-t border-surface-800 p-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {initials(userName)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-surface-500 text-xs truncate">{userEmail}</div>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sair"
            className="p-1.5 rounded-md text-surface-500 hover:text-surface-300 hover:bg-surface-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-2 pb-1 pt-2">
      <span className="text-surface-600 text-xs font-semibold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        active
          ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
          : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
      )}
    >
      <span className={cn("shrink-0", active ? "text-brand-400" : "text-surface-600")}>
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {active && <ChevronRight className="w-3 h-3 text-brand-500 shrink-0" />}
    </Link>
  );
}