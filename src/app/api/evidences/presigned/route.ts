// src/app/api/evidences/presigned/route.ts
import { NextRequest, NextResponse } from "next/server";

// ─── POST /api/evidences/presigned ─────────────────────────────────────────
// Gera URL presignada para upload direto do browser para o R2

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });

  const { municipalityId, criteriaId, fileName, fileType, fileSizeBytes } = await req.json();

  if (!municipalityId || !criteriaId || !fileName || !fileType || !fileSizeBytes) {
    return NextResponse.json({ success: false, error: "Campos obrigatórios" }, { status: 400 });
  }

  // Valida tipo e tamanho
  const validation = validateFile(fileType, Number(fileSizeBytes));
  if (!validation.valid) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const fileKey = generateFileKey(municipalityId, criteriaId, fileName);
  const presignedUrl = await generatePresignedUploadUrl(fileKey, fileType, Number(fileSizeBytes));

  return NextResponse.json({
    success: true,
    data: { presignedUrl, fileKey },
  });
}
