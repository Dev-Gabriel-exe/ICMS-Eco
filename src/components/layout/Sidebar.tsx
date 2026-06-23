"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Leaf, LayoutDashboard, Building2, Users, ChevronRight,
  LogOut, FileText, FileBarChart2,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/types";

interface SidebarProps {
  role: Role;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  municipalityId?: string;
  municipalityName?: string;
}

const ADMIN_NAV = [
  { label: "Painel Geral",  href: "/admin",            icon: LayoutDashboard, exact: true },
  { label: "Municípios",    href: "/admin/municipios", icon: Building2 },
  { label: "Usuários",      href: "/admin/usuarios",   icon: Users },
  { label: "Atividades",    href: "/admin/atividades", icon: FileBarChart2 },
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

// Paleta
const C = {
  bg:           "#1a2e23",
  border:       "#243d2e",
  textActive:   "#e2f5eb",
  textIdle:     "#7bab8e",
  textSection:  "#4d7a5e",
  textMuted:    "#4d7a5e",
  activeBg:     "#1e3d2a",
  activeBorder: "#2d6644",
  hoverBg:      "#1e3228",
  iconActive:   "#4ade80",
  iconIdle:     "#4d7a5e",
  dot:          "#4ade80",
  dotIdle:      "#3a5c47",
};

export function Sidebar({
  role, userName, userEmail, userAvatarUrl, municipalityId, municipalityName,
}: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const isPerfilActive = pathname === "/perfil";

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col"
      style={{ background: C.bg, borderRight: `1px solid ${C.border}` }}
    >
      {/* Logo */}
      <div
        className="h-16 px-5 flex items-center gap-3 shrink-0"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
        >
          <Leaf className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-none tracking-tight" style={{ color: C.textActive }}>
            ICMS-ECO
          </div>
          <div className="text-xs mt-0.5 truncate" style={{ color: C.textMuted }}>
            {role === "admin" ? "Administrador" : municipalityName ?? "Gestão Municipal"}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
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
            <div className="mt-3">
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
            <NavSection label="Principal" />
            <NavLink
              href={`/municipio/${municipalityId}`}
              label="Painel do Município"
              icon={<LayoutDashboard className="w-4 h-4" />}
              active={pathname === `/municipio/${municipalityId}`}
            />
            <NavLink
              href={`/municipio/${municipalityId}/habilitacao`}
              label="Habilitação"
              icon={<FileText className="w-4 h-4" />}
              active={isActive(`/municipio/${municipalityId}/habilitacao`)}
            />
            <NavLink
              href={`/municipio/${municipalityId}/evidencias`}
              label="Evidências"
              icon={<FileText className="w-4 h-4" />}
              active={isActive(`/municipio/${municipalityId}/evidencias`)}
            />
            <NavLink
              href={`/municipio/${municipalityId}/relatorio`}
              label="Relatório"
              icon={<FileBarChart2 className="w-4 h-4" />}
              active={isActive(`/municipio/${municipalityId}/relatorio`)}
            />
            <div className="mt-3">
              <NavSection label="Checklist por Eixo" />
              {MUNICIPALITY_AXES.map(({ axis, label }) => (
                <NavLink
                  key={axis}
                  href={`/municipio/${municipalityId}/checklist/${axis}`}
                  label={`${axis} — ${label}`}
                  icon={
                    <span className="w-4 h-4 flex items-center justify-center text-[11px] font-bold">
                      {axis}
                    </span>
                  }
                  active={isActive(`/municipio/${municipalityId}/checklist/${axis}`)}
                />
              ))}
            </div>
          </>
        ) : null}
      </nav>

      {/* Perfil + logout */}
      <div className="p-3 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">

          {/* Avatar clicável → /perfil */}
          <Link
            href="/perfil"
            title="Meu perfil"
            className={cn(
              "w-8 h-8 rounded-xl shrink-0 overflow-hidden transition-opacity hover:opacity-80",
              isPerfilActive && "ring-2 ring-green-400 ring-offset-1 ring-offset-[#1a2e23]"
            )}
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 100%)" }}
              >
                {initials(userName)}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link href="/perfil" className="hover:underline underline-offset-2" style={{ color: C.textActive }}>
              <div className="text-xs font-semibold truncate">{userName}</div>
            </Link>
            <div className="text-xs truncate" style={{ color: C.textMuted }}>
              {userEmail}
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sair"
            className="p-1.5 rounded-lg transition-colors duration-150"
            style={{ color: C.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.textActive;
              e.currentTarget.style.background = C.hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.textMuted;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavSection({ label }: { label: string }) {
  return (
    <div className="px-2 pb-1 pt-3">
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: C.textSection }}
      >
        {label}
      </span>
    </div>
  );
}

function NavLink({
  href, label, icon, active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150"
      style={{
        color:      active ? C.textActive : C.textIdle,
        background: active ? C.activeBg   : "transparent",
        border:     `1px solid ${active ? C.activeBorder : "transparent"}`,
        fontWeight: active ? 600 : 400,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.hoverBg; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: active ? C.dot : C.dotIdle }}
      />
      <span style={{ color: active ? C.iconActive : C.iconIdle }} className="shrink-0">
        {icon}
      </span>
      <span className="truncate flex-1">{label}</span>
      {active && (
        <ChevronRight className="w-3 h-3 shrink-0" style={{ color: C.iconActive }} />
      )}
    </Link>
  );
}