// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/utils";

// ─── GET /api/users — lista funcionários (admin) ───────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  // /me — retorna dados do usuário atual
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, data: user });
}

// ─── POST /api/users — cria funcionário (admin) ───────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  const { name, email } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ success: false, error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, error: "E-mail inválido" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ success: false, error: "E-mail já cadastrado" }, { status: 409 });
  }

  // Gera senha provisória segura
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
  const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "employee",
    },
  });

  // Envia email com credenciais
  try {
    await sendWelcomeEmail({
      to: { email: user.email, name: user.name },
      tempPassword,
    });
  } catch (err) {
    console.error("[users/POST] Falha ao enviar email:", err);
    // Não falha o request por isso
  }

  return NextResponse.json({
    success: true,
    data: { id: user.id, name: user.name, email: user.email },
  }, { status: 201 });
}
