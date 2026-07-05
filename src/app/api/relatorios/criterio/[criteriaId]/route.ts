// src/app/api/relatorio/criterio/[criteriaId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ExternalHyperlink,
} from "docx";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_GREEN = "166534"; // hex sem #
const SLATE_500   = "64748b";
const SLATE_200   = "e2e8f0";

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

}

function fmtBytes(b: number | null | undefined): string {
  if (!b) return "—";
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabelPt(status: string): string {
  const map: Record<string, string> = {
    not_started: "Não iniciado",
    in_progress: "Em andamento",
    complete: "Completo",
  };
  return map[status] ?? status;
}

function validationLabelPt(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Reprovado",
  };
  return map[status] ?? status;
}

/** Extrai a extensão de imagem aceita pela lib docx a partir do mimetype */
function imageTypeFromMime(mime: string | null): "jpg" | "png" | "gif" | "bmp" | null {
  if (!mime) return null;
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("bmp")) return "bmp";
  return null;
}

/** Baixa o arquivo da URL pública do R2 e retorna o buffer (com timeout de segurança) */
async function fetchFileBuffer(url: string): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("[relatorio/criterio] Falha ao baixar arquivo:", url, err);
    return null;
  }
}

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 120 },
    border: {
      bottom: { color: BRAND_GREEN, space: 4, style: BorderStyle.SINGLE, size: 6 },
    },
    children: [new TextRun({ text, bold: true, color: BRAND_GREEN, size: 26 })],
  });
}

function labelValueRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 32, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, color: "F8FAFC" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: SLATE_500 })] })],
      }),
      new TableCell({
        width: { size: 68, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: value || "—", size: 20 })] })],
      }),
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/relatorio/criterio/[criteriaId]?municipioId=&certameId=
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { criteriaId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const { criteriaId } = params;
  const municipioId = req.nextUrl.searchParams.get("municipioId");
  const certameId    = req.nextUrl.searchParams.get("certameId");

  if (!municipioId || !certameId) {
    return NextResponse.json(
      { success: false, error: "Parâmetros municipioId e certameId são obrigatórios" },
      { status: 400 }
    );
  }

  // Controle de acesso: admin/reviewer veem tudo; employee precisa estar vinculado ao município
  if (!["admin", "reviewer"].includes(session.user.role)) {
    const link = await db.userMunicipality.findUnique({
      where: { userId_municipalityId: { userId: session.user.id, municipalityId: municipioId } },
    });
    if (!link) {
      return NextResponse.json({ success: false, error: "Sem acesso a este município" }, { status: 403 });
    }
  }

  // Busca o item do checklist com tudo que precisamos
  const item = await db.checklistItem.findUnique({
    where: {
      municipalityId_certameId_criteriaId: {
        municipalityId: municipioId,
        certameId,
        criteriaId,
      },
    },
    include: {
      criteria: { include: { subDocs: true } },
      municipality: true,
      certame: true,
      evidences: {
        where: { validationStatus: "approved" },
        orderBy: { uploadedAt: "asc" },
        include: {
          uploader: { select: { name: true, email: true } },
          validator: { select: { name: true, email: true } },
          subDoc: { select: { label: true } },
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item de checklist não encontrado para este critério/município/certame" },
      { status: 404 }
    );
  }

  const { criteria, municipality, certame, evidences } = item;

  // ─────────────────────────────────────────────
  // Monta o corpo do documento
  // ─────────────────────────────────────────────

  const bodyChildren: (Paragraph | Table)[] = [];

  // ── Capa ──
  bodyChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "🌿 Relatório de Evidências", bold: true, size: 36, color: BRAND_GREEN })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "ICMS Ecológico · Decreto 24.288/2025", italics: true, size: 22, color: SLATE_500 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        new TextRun({
          text: `Critério ${criteria.id} — ${criteria.axisName}`,
          bold: true,
          size: 24,
        }),
      ],
    })
  );

  // ── Tabela de identificação ──
  bodyChildren.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
        bottom: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
        left: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
        right: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200 },
      },
      rows: [
        labelValueRow("Município", municipality.name),
        labelValueRow("Certame", String(certame.year)),
        labelValueRow("Eixo", `${criteria.axis} — ${criteria.axisName}`),
        labelValueRow("Critério", criteria.id),
        labelValueRow("Descrição", criteria.description),
        labelValueRow("Status do item", statusLabelPt(item.status)),
        labelValueRow("Pontuação registrada", item.pointsClaimed != null ? `${item.pointsClaimed} pts` : "—"),
        labelValueRow("Pontuação máxima", `${criteria.maxPoints} pts`),
        labelValueRow("Data de geração", fmtDate(new Date())),
      ],
    })
  );

  // ── Requisito ──
  bodyChildren.push(
    sectionHeading("Requisito (Decreto 24.288/2025)"),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: criteria.requirement || "—", size: 21 })] })
  );

  // ── Documentação exigida ──
  bodyChildren.push(
    sectionHeading("Documentação Comprobatória Exigida"),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: criteria.requiredDocs || "—", size: 21 })] })
  );

  // ── Observações internas, se houver ──
  if (item.notes) {
    bodyChildren.push(
      sectionHeading("Observações Internas"),
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: item.notes, size: 21, italics: true })] })
    );
  }

  // ── Evidências aprovadas ──
  bodyChildren.push(sectionHeading(`Evidências Aprovadas (${evidences.length})`));

  if (evidences.length === 0) {
    bodyChildren.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Nenhuma evidência aprovada para este critério até o momento.", italics: true, color: SLATE_500, size: 21 })],
      })
    );
  }

  for (const [idx, ev] of evidences.entries()) {
    const docLabel = ev.subDoc?.label ? ` — ${ev.subDoc.label}` : "";

    bodyChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({ text: `${idx + 1}. ${ev.fileName}`, bold: true, size: 22 }),
          new TextRun({ text: docLabel, size: 20, color: SLATE_500 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Tamanho: ${fmtBytes(ev.fileSizeBytes)} · Enviado por: ${ev.uploader?.name ?? "—"} em ${fmtDate(ev.uploadedAt)}`,
            size: 18,
            color: SLATE_500,
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Validado por: ${ev.validator?.name ?? "—"} em ${fmtDate(ev.validatedAt)} · Status: ${validationLabelPt(ev.validationStatus)}`,
            size: 18,
            color: SLATE_500,
          }),
        ],
      })
    );

    // Tenta incorporar imagem; caso contrário, link clicável
    const imgType = imageTypeFromMime(ev.fileType);
    if (imgType) {
      const buffer = await fetchFileBuffer(ev.fileUrl);
      if (buffer) {
        try {
          bodyChildren.push(
            new Paragraph({
              spacing: { after: 200 },
              children: [
                new ImageRun({
                  type: imgType,
                  data: buffer,
                  transformation: { width: 420, height: 280 },
                }),
              ],
            })
          );
          continue; // já incorporou — não precisa do link
        } catch (err) {
          console.error("[relatorio/criterio] Falha ao incorporar imagem:", ev.fileName, err);
        }
      }
    }

    // Link clicável (PDF, Word, Excel, ou fallback de imagem que falhou)
    bodyChildren.push(
      new Paragraph({
        spacing: { after: 220 },
        children: [
          new TextRun({ text: "📎 ", size: 20 }),
          new ExternalHyperlink({
            link: ev.fileUrl,
            children: [
              new TextRun({
                text: "Abrir arquivo original",
                style: "Hyperlink",
                size: 20,
                color: "2563eb",
                underline: {},
              }),
            ],
          }),
        ],
      })
    );
  }

  // ── Rodapé informativo ──
  bodyChildren.push(
    new Paragraph({
      spacing: { before: 400 },
      border: { top: { color: SLATE_200, space: 8, style: BorderStyle.SINGLE, size: 4 } },
      children: [
        new TextRun({
          text: `Relatório gerado automaticamente pelo sistema ICMS-ECO em ${fmtDate(new Date())}.`,
          size: 16,
          italics: true,
          color: SLATE_500,
        }),
      ],
    })
  );

  // ─────────────────────────────────────────────
  // Gera o documento
  // ─────────────────────────────────────────────

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } },
        },
        children: bodyChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  const safeCriterio = criteria.id.replace(/[^a-zA-Z0-9.-]/g, "_");
  const safeMunicipio = municipality.name.replace(/[^a-zA-Z0-9-]/g, "_");
  const fileName = `Relatorio_${safeCriterio}_${safeMunicipio}_${certame.year}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
