// src/app/api/users/[id]/hard-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ success: false, error: "Usuário não encontrado." }, { status: 404 });
  }

  if (user.role === "admin") {
    return NextResponse.json({ success: false, error: "Não é possível excluir um administrador." }, { status: 403 });
  }

  await db.user.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}