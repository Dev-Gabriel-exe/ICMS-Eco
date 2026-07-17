// src/components/layout/MobileNav.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Leaf,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/types";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface MobileNavProps {
  role: Role;
  userName: string;
  userEmail: string;
  municipalityId?: string;
  municipalityName?: string;
  /** Título da página atual para o header */
  pageTitle?: string;
}

const ADMIN_NAV = [
  { label: "Painel Geral", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Municípios", href: "/admin/municipios", icon: Building2 },
  { label: "Usuários", href: "/admin/usuarios", icon: Users },
  { label: "Relatórios", href: "/admin/relatorios", icon: FileText },
];

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
// Componente principal
// ─────────────────────────────────────────────

export function MobileNav({
  role,
  userName,
  userEmail,
  municipalityId,
  municipalityName,
  pageTitle,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const homeHref = role === "admin" ? "/admin" : "/municipio";

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const close = () => setOpen(false);

  return (
    <>
      {/* ── Top bar mobile ── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 h-14 bg-surface-900 border-b border-surface-800 flex items-center px-4 gap-3">
        {/* Hamburguer */}
        <button
          onClick={() => setOpen(true)}
          className="p-2 -ml-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center shrink-0">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm truncate">
            {pageTitle ?? "ICMS-ECO"}
          </span>
        </Link>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-semibold">{initials(userName)}</span>
        </div>
      </header>

      {/* ── Overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer ── */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface-900 border-r border-surface-800",
          "flex flex-col transition-transform duration-250 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header do drawer */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-surface-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <Link href={homeHref} className="w-7 h-7 bg-brand-600 rounded-md flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-white" />
            </Link>
            <div>
              <Link href={homeHref} className="text-white text-sm font-semibold leading-none hover:opacity-80">
                ICMS-ECO
              </Link>
              <div className="text-surface-500 text-xs mt-0.5">
                {role === "admin" ? "Administrador" : "Gestão Municipal"}
              </div>
            </div>
          </div>

          <button
            onClick={close}
            className="p-1.5 rounded-lg text-surface-500 hover:text-white hover:bg-surface-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {role === "admin" ? (
            <>
              <NavSection label="Administração" />
              {ADMIN_NAV.map((item) => (
                <DrawerLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={<item.icon className="w-4 h-4" />}
                  active={isActive(item.href, item.exact)}
                  onClick={close}
                />
              ))}
            </>
          ) : municipalityId ? (
            <>
              <DrawerLink
                href={`/municipio/${municipalityId}`}
                label="Painel do Município"
                icon={<LayoutDashboard className="w-4 h-4" />}
                active={pathname === `/municipio/${municipalityId}`}
                onClick={close}
              />

              {municipalityName && (
                <div className="mx-2 my-2 px-3 py-2 bg-brand-900/40 border border-brand-800/50 rounded-lg">
                  <p className="text-brand-400 text-xs font-medium truncate">
                    {municipalityName}
                  </p>
                </div>
              )}

              <div className="mt-3">
                <NavSection label="Checklist por Eixo" />
                {MUNICIPALITY_AXES.map(({ axis, label }) => (
                  <DrawerLink
                    key={axis}
                    href={`/municipio/${municipalityId}/checklist/${axis}`}
                    label={`Eixo ${axis} — ${label}`}
                    icon={
                      <span className="w-4 h-4 flex items-center justify-center text-xs font-bold">
                        {axis}
                      </span>
                    }
                    active={isActive(`/municipio/${municipalityId}/checklist/${axis}`)}
                    onClick={close}
                  />
                ))}
              </div>

              <div className="mt-3">
                <NavSection label="Documentos" />
                <DrawerLink
                  href={`/municipio/${municipalityId}/evidencias`}
                  label="Evidências"
                  icon={<FileText className="w-4 h-4" />}
                  active={isActive(`/municipio/${municipalityId}/evidencias`)}
                  onClick={close}
                />
                <DrawerLink
                  href={`/municipio/${municipalityId}/relatorio`}
                  label="Relatório PDF"
                  icon={<FileText className="w-4 h-4" />}
                  active={isActive(`/municipio/${municipalityId}/relatorio`)}
                  onClick={close}
                />
              </div>
            </>
          ) : null}
        </nav>

        {/* Perfil e logout */}
        <div className="border-t border-surface-800 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-semibold">{initials(userName)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{userName}</div>
              <div className="text-surface-500 text-xs truncate">{userEmail}</div>
            </div>
            <button
              onClick={() => {
                void signOut({ redirect: false }).then(() => {
                  window.location.assign("/login");
                });
              }}
              title="Sair"
              className="p-1.5 rounded-md text-surface-500 hover:text-red-400 hover:bg-surface-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
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

function DrawerLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
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
