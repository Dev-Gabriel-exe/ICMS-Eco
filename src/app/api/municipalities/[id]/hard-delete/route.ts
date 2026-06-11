// src/app/api/municipalities/[id]/hard-delete/route.ts
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

  try {
    await db.municipality.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    // P2025 = registro não encontrado no Prisma
    if (err?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Município não encontrado." }, { status: 404 });
    }
    // P2003 = violação de foreign key (há dados relacionados)
    if (err?.code === "P2003") {
      return NextResponse.json({
        success: false,
        error: "Este município possui dados relacionados. Desative-o em vez de excluir.",
      }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: "Erro ao excluir município." }, { status: 500 });
  }
}