// src/app/(dashboard)/municipio/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function MunicipioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "admin") {
    // Admin vai pro painel geral
    redirect("/admin");
  }

  // Funcionário: redireciona para o primeiro município vinculado
  const link = await db.userMunicipality.findFirst({
    where: { userId: session.user.id },
    include: { municipality: { select: { id: true, isActive: true } } },
    orderBy: { municipality: { name: "asc" } },
  });

  if (!link || !link.municipality.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🌿</div>
          <h1 className="text-xl font-semibold text-surface-800 mb-2">Sem município vinculado</h1>
          <p className="text-sm text-surface-500">
            Aguarde o administrador vincular você a um município para começar.
          </p>
        </div>
      </div>
    );
  }

  redirect(`/municipio/${link.municipality.id}`);
}
