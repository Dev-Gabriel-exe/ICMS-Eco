// src/app/(dashboard)/admin/municipios/[id]/page.tsx
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

import MunicipioEditForm from "./MunicipioEditForm";

export const metadata = { title: "Editar Município" };


export default async function EditMunicipioPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const [municipality, users, allUsers] = await Promise.all([
    db.municipality.findUnique({ where: { id: params.id } }),
    db.userMunicipality.findMany({
      where: { municipalityId: params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.user.findMany({
      where: { role: "employee" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!municipality) notFound();

  return (
    <MunicipioEditForm
      municipality={municipality}
      linkedUsers={users.map((u) => u.user)}
      allUsers={allUsers}
    />
  );
}
