// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Primeiro acesso: forçar troca de senha
  // (verificado via API ao carregar o layout)

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar
        role={session.user.role as "admin" | "employee"}
        userName={session.user.name ?? "Usuário"}
        userEmail={session.user.email ?? ""}
      />

      {/* Conteúdo principal */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}