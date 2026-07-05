// src/app/api/municipalities/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const { name, population, ibgeCode, isActive, userIds } = await req.json();

  const updated = await db.$transaction(async (tx) => {
    const municipality = await tx.municipality.update({
      where: { id: params.id },
      data: {
        ...(typeof name === "string" && { name: name.trim() }),
        ...(population !== undefined && { population: Number(population) }),
        ...(ibgeCode !== undefined && { ibgeCode: ibgeCode?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    if (Array.isArray(userIds)) {
      await tx.userMunicipality.deleteMany({
        where: { municipalityId: params.id },
      });

      const uniqueUserIds = [...new Set(
        userIds
          .filter((userId: unknown): userId is string => typeof userId === "string" && userId.length > 0)
      )];

      if (uniqueUserIds.length > 0) {
        await tx.userMunicipality.createMany({
          data: uniqueUserIds.map((userId) => ({
            userId,
            municipalityId: params.id,
          })),
          skipDuplicates: true,
        });
      }
    }

    return municipality;
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
