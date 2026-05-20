// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ success: true, data: notifications });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { id } = await req.json();

  await db.notification.update({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
