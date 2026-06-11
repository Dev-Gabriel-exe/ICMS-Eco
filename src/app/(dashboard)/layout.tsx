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
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f0faf5]">
      <Sidebar
        role={session.user.role as "admin" | "employee"}
        userName={session.user.name ?? "Usuário"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}