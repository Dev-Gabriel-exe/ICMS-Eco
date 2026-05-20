// src/app/api/municipalities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const m = await db.municipality.findUnique({ where: { id: params.id } });
  if (!m) return NextResponse.json({ success: false, error: "Não encontrado" }, { status: 404 });

  return NextResponse.json({ success: true, data: m });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const { name, population, ibgeCode, isActive } = await req.json();

  const updated = await db.municipality.update({
    where: { id: params.id },
    data: {
      ...(name && { name: name.trim() }),
      ...(population && { population: Number(population) }),
      ...(ibgeCode !== undefined && { ibgeCode: ibgeCode?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  await db.municipality.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
