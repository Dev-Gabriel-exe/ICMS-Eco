import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("name") ?? "arquivo";

  if (!fileUrl) {
    return NextResponse.json({ success: false, error: "URL do arquivo é obrigatória" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(fileUrl);
  } catch {
    return NextResponse.json({ success: false, error: "Não foi possível acessar o arquivo" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ success: false, error: "Arquivo indisponível" }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, '\\"')}"`);

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
