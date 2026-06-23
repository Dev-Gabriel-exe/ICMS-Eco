// src/app/api/profile/avatar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { r2Client } from "@/lib/r2";
import { db } from "@/lib/db";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipo inválido. Use JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { success: false, error: "Imagem muito grande. Máximo: 5 MB." },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const fileKey = `avatares/${session.user.id}/${Date.now()}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const avatarUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${fileKey}`;

    await db.user.update({
      where: { id: session.user.id },
      data: { avatarUrl },
    });

    return NextResponse.json({ success: true, avatarUrl });
  } catch (err) {
    console.error("[avatar]", err);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}