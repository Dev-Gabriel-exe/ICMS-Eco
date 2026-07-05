// src/app/(dashboard)/admin/usuarios/[id]/page.tsx
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import UserEditForm from "./UserEditForm";

export const metadata = { title: "Editar Funcionário" };

export default async function EditUserPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [user, allMunicipalities] = await Promise.all([
    db.user.findUnique({
      where: { id: params.id },
      include: {
        userMunicipalities: { include: { municipality: { select: { id: true, name: true } } } },
      },
    }),
    db.municipality.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!user) notFound();

  return (
    <UserEditForm
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive ?? true,
      }}
      linkedMunicipalities={user.userMunicipalities.map((um) => um.municipality)}
      allMunicipalities={allMunicipalities}
    />
  );
}
