// src/app/api/users/me/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro /api/users/me:", error);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}