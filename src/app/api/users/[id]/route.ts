// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET /api/users/[id] ────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const id = params.id === "me" ? session.user.id : params.id;

  // Funcionário só pode ver a si mesmo
  if (session.user.role !== "admin" && id !== session.user.id) {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      userMunicipalities: {
        include: { municipality: { select: { id: true, name: true } } },
      },
    },
  });

  if (!user) return NextResponse.json({ success: false, error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({ success: true, data: user });
}

// ─── PUT /api/users/[id] — edita usuário (admin) ──────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const { name, isActive, role, municipalityIds } = await req.json();

  await db.user.update({
    where: { id: params.id },
    data: {
      ...(name && { name }),
      ...(isActive !== undefined && { isActive }),
      ...(role && ["employee", "reviewer"].includes(role) && { role }),
    },
  });

  // Atualiza vínculos com municípios
  if (Array.isArray(municipalityIds)) {
    await db.userMunicipality.deleteMany({ where: { userId: params.id } });
    if (municipalityIds.length > 0) {
      await db.userMunicipality.createMany({
        data: municipalityIds.map((mid: string) => ({
          userId: params.id,
          municipalityId: mid,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ success: true });
}

// ─── DELETE /api/users/[id] — desativa usuário (admin) ─────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  // Soft delete: marca como inativo
  await db.user.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
