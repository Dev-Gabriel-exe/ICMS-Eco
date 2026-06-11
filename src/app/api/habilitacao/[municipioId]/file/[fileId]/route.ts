// src/app/api/habilitacao/[municipioId]/file/[fileId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/r2";

// ─── DELETE /api/habilitacao/[municipioId]/file/[fileId] ────────────────────
// Remove um arquivo de habilitação.
// - Município só pode remover arquivos de docs não aprovados.
// - Admin pode remover qualquer arquivo.
// - Se o doc ficar sem arquivos, volta ao status "not_started".

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { municipioId: string; fileId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { municipioId, fileId } = params;
  const isAdmin = session.user.role === "admin";
  if (!isAdmin) {
  const link = await db.userMunicipality.findUnique({
    where: {
      userId_municipalityId: {
        userId: session.user.id,
        municipalityId: municipioId,
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
  // Busca o arquivo com o doc pai
  const file = await db.habilitacaoFile.findUnique({
    where: { id: fileId },
    include: { habDoc: true },
  });

  if (!file) {
    return NextResponse.json({ success: false, error: "Arquivo não encontrado" }, { status: 404 });
  }

  // Verifica que o arquivo pertence ao município da rota
  if (file.habDoc.municipalityId !== municipioId) {
    return NextResponse.json({ success: false, error: "Acesso negado" }, { status: 403 });
  }

  // Município não pode remover arquivo de doc aprovado
  if (!isAdmin && file.habDoc.status === "approved") {
    return NextResponse.json(
      { success: false, error: "Não é possível remover arquivo de documento aprovado" },
      { status: 403 }
    );
  }

  // Remove do R2
  try {
    await deleteFile(file.fileKey);
  } catch {
    // Continua mesmo se falhar no R2 (melhor remover do banco)
    console.error("Falha ao remover arquivo do R2:", file.fileKey);
  }

  // Remove do banco
  await db.habilitacaoFile.delete({ where: { id: fileId } });

  // Verifica se o doc ficou sem arquivos → volta para not_started
  const remaining = await db.habilitacaoFile.count({
    where: { habDocId: file.habDoc.id },
  });

  if (remaining === 0 && file.habDoc.status !== "approved") {
    await db.habilitacaoDoc.update({
      where: { id: file.habDoc.id },
      data: { status: "not_started" },
    });
  }

  return NextResponse.json({ success: true });
}