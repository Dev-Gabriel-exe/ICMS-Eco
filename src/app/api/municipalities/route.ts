// src/app/api/municipalities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── GET /api/municipalities ───────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  let municipalities;

  if (session.user.role === "admin") {
    municipalities = await db.municipality.findMany({
      orderBy: { name: "asc" },
    });
  } else {
    const links = await db.userMunicipality.findMany({
      where: { userId: session.user.id },
      include: { municipality: true },
    });
    municipalities = links.map((l) => l.municipality).filter((m) => m.isActive);
  }

  return NextResponse.json({ success: true, data: municipalities });
}

// ─── POST /api/municipalities ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const { name, population, ibgeCode } = await req.json();

  if (!name?.trim() || !population) {
    return NextResponse.json({ success: false, error: "Nome e população são obrigatórios" }, { status: 400 });
  }

  const municipality = await db.municipality.create({
    data: {
      name: name.trim(),
      population: Number(population),
      ibgeCode: ibgeCode?.trim() || null,
    },
  });

  return NextResponse.json({ success: true, data: municipality }, { status: 201 });
}
