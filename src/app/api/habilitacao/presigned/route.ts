// src/app/api/habilitacao/presigned/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePresignedUploadUrl, validateFile } from "@/lib/r2";
import crypto from "crypto";
import { db } from "@/lib/db";
function generateHabFileKey(municipalityId: string, docCode: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  const uuid      = crypto.randomUUID();
  const ts        = Date.now();
  return `habilitacao/${municipalityId}/${docCode}/${ts}-${uuid}-${sanitized}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const { municipalityId, docCode, fileName, fileType, fileSizeBytes } = body;
  const isAdmin = session.user.role === "admin";

if (!isAdmin) {
  const link = await db.userMunicipality.findUnique({
    where: {
      userId_municipalityId: {
        userId: session.user.id,
        municipalityId,
      },
    },
  });

  if (!link) {
    return NextResponse.json(
      { success: false, error: "Acesso negado" },
      { status: 403 }
    );
  }
}
  if (!municipalityId || !docCode || !fileName || !fileType || !fileSizeBytes) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const validation = validateFile(fileType, Number(fileSizeBytes));
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const fileKey     = generateHabFileKey(municipalityId, docCode, fileName);
  const presignedUrl = await generatePresignedUploadUrl(fileKey, fileType, Number(fileSizeBytes));

  return NextResponse.json({ success: true, data: { presignedUrl, fileKey } });
}