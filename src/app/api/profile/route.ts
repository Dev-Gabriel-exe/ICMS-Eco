// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, currentPassword, newPassword } = body as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (name?.trim()) updates.name = name.trim();

    if (email?.trim() && email !== user.email) {
      const existing = await db.user.findUnique({ where: { email: email.trim() } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "Este e-mail já está em uso." },
          { status: 409 }
        );
      }
      updates.email = email.trim();
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "A nova senha deve ter no mínimo 8 caracteres." },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Informe a senha atual para alterá-la." },
          { status: 400 }
        );
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json(
          { success: false, error: "Senha atual incorreta." },
          { status: 400 }
        );
      }
      updates.passwordHash = await bcrypt.hash(newPassword, 10);
      // Se usuário tinha flag de troca obrigatória, limpa
      updates.mustChangePassword = false;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: "Nenhuma alteração informada." }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[profile PUT]", err);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}