// src/app/api/certames/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const certames = await db.certame.findMany({ orderBy: { year: "desc" } });
  return NextResponse.json({ success: true, data: certames });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const { year, periodoInicio, periodoFim } = await req.json();

  if (!year || !periodoInicio || !periodoFim) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
  }

  const existing = await db.certame.findUnique({ where: { year: Number(year) } });
  if (existing) {
    return NextResponse.json({ success: false, error: "Certame deste ano já existe" }, { status: 409 });
  }

  // Desativa certames anteriores
  await db.certame.updateMany({ where: { isActive: true }, data: { isActive: false } });

  const certame = await db.certame.create({
    data: {
      year: Number(year),
      periodoInicio: new Date(periodoInicio),
      periodoFim: new Date(periodoFim),
      isActive: true,
    },
  });

  // Notifica todos os usuários
  try {
    const users = await db.user.findMany({ select: { email: true, name: true } });
    await sendCertameOpenedEmail({
      to: users.map((u) => ({ email: u.email, name: u.name })),
      certameYear: certame.year,
      periodoInicio: certame.periodoInicio.toLocaleDateString("pt-BR"),
      periodoFim: certame.periodoFim.toLocaleDateString("pt-BR"),
    });
  } catch (err) {
    console.error("[certames/POST] Falha ao notificar:", err);
  }

  return NextResponse.json({ success: true, data: certame }, { status: 201 });
}
