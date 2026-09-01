// src/app/api/users/[id]/hard-delete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Acesso negado" },
        { status: 403 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Não é possível excluir um administrador.",
        },
        { status: 403 }
      );
    }

    if (user.deletedAt) {
      return NextResponse.json(
        { success: false, error: "Este usuário já foi removido." },
        { status: 400 }
      );
    }

    // Não apagamos fisicamente o registro porque ele pode possuir
    // evidências, arquivos e histórico de auditoria vinculados.
    //
    // O e-mail é alterado para liberar o endereço original
    // para um novo cadastro.
    await db.user.update({
      where: { id: params.id },
      data: {
        name: "Usuário removido",
        email: `deleted-${user.id}@deleted.local`,
        isActive: false,
        avatarUrl: null,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Usuário removido com sucesso.",
    });
  } catch (error) {
    console.error("[users/hard-delete] Erro:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível excluir o usuário.",
      },
      { status: 500 }
    );
  }
}