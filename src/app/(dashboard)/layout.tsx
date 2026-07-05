// src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { SessionProvider } from "@/components/providers/SessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-[#f0faf5]">
        <Sidebar
          role={session.user.role as "admin" | "employee"}
          userName={session.user.name ?? "Usuário"}
          userEmail={session.user.email ?? ""}
          userAvatarUrl={session.user.avatarUrl ?? null}
          className="print:hidden"
        />
        <main className="flex-1 ml-64 min-h-screen print:ml-0 print:w-full">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
