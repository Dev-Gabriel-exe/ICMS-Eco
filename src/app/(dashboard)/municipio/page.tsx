// src/app/(dashboard)/municipio/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Building2 } from "lucide-react";

export default async function MunicipioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  const link = await db.userMunicipality.findFirst({
    where: { userId: session.user.id },
    include: { municipality: { select: { id: true, isActive: true } } },
    orderBy: { municipality: { name: "asc" } },
  });

  if (!link || !link.municipality.isActive) {
    return (
      <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center p-6 relative">
        {/* Blobs */}
        <div
          className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] opacity-30"
          style={{ background: "radial-gradient(circle at 80% 20%, #6ee7b7 0%, transparent 60%)", filter: "blur(60px)" }}
        />
        <div
          className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] opacity-20"
          style={{ background: "radial-gradient(circle at 20% 80%, #34d399 0%, transparent 60%)", filter: "blur(50px)" }}
        />

        <div
          className="relative text-center max-w-sm"
          style={{ animation: "fadeSlideUp 0.5s ease both" }}
        >
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-6">
            <Building2 className="w-9 h-9 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Sem município vinculado</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Aguarde o administrador vincular você a um município para começar.
          </p>
        </div>

        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(14px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  redirect(`/municipio/${link.municipality.id}`);
}