// src/app/api/atividades/relatorio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber,
} from "docx";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GREEN       = "166534";
const GREEN_LIGHT = "F0FDF4";
const SLATE_500   = "64748B";
const SLATE_200   = "E2E8F0";
const SLATE_50    = "F8FAFC";
const BLACK       = "0F172A";

const ACTION_LABELS: Record<string, string> = {
  MUNICIPALITY_CREATED:    "Município criado",
  MUNICIPALITY_UPDATED:    "Município atualizado",
  USER_CREATED:            "Usuário criado",
  USER_UPDATED:            "Usuário atualizado",
  USER_LOGIN:              "Login",
  USER_LOGOUT:             "Logout",
  EVIDENCE_UPLOADED:       "Evidência enviada",
  EVIDENCE_APPROVED:       "Evidência aprovada",
  EVIDENCE_RETURNED:       "Evidência devolvida",
  EVIDENCE_REJECTED:       "Evidência rejeitada",
  EVIDENCE_DELETED:        "Evidência excluída",
  CHECKLIST_UPDATED:       "Checklist atualizado",
  CERTAME_CREATED:         "Certame criado",
  CERTAME_UPDATED:         "Certame atualizado",
  CERTAME_CLOSED:          "Certame encerrado",
  HABILITACAO_FILE_UPLOADED: "Habilitação enviada",
  HABILITACAO_DOC_APPROVED:  "Habilitação aprovada",
  HABILITACAO_DOC_REJECTED:  "Habilitação rejeitada",
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateOnly(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const border = (color = SLATE_200) => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (color?: string) => {
  const b = border(color);
  return { top: b, bottom: b, left: b, right: b };
};
const noBorder = () => {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b };
};

const PAGE_W = 9072; // A4 com margens de ~1,7cm em DXA

function cell(
  text: string,
  opts: { bold?: boolean; color?: string; bg?: string; width?: number; align?: typeof AlignmentType[keyof typeof AlignmentType] } = {}
) {
  return new TableCell({
    width:    { size: opts.width ?? 0, type: WidthType.DXA },
    borders:  allBorders(SLATE_200),
    shading:  opts.bg ? { fill: opts.bg, type: ShadingType.CLEAR } : undefined,
    margins:  { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [
          new TextRun({
            text,
            bold:  opts.bold  ?? false,
            color: opts.color ?? BLACK,
            size:  17,
            font:  "Arial",
          }),
        ],
      }),
    ],
  });
}

// ─── GET /api/atividades/relatorio?from=&to= ─────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Acesso restrito" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to)   dateFilter.lte = new Date(`${to}T23:59:59`);
  const hasFilter = !!(from || to);

  const logs = await db.auditLog.findMany({
    where: hasFilter ? { createdAt: dateFilter } : undefined,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const now         = fmtDate(new Date());
  const periodoLabel = from || to
    ? `${from ? fmtDateOnly(from) : "início"} até ${to ? fmtDateOnly(to) : "hoje"}`
    : "Todas as atividades";

  // ── Cabeçalho do doc ──
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "RELATÓRIO DE ATIVIDADES", bold: true, size: 32, color: GREEN, font: "Arial" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: "Sistema ICMS-ECO · SEMARH-PI", size: 18, color: SLATE_500, font: "Arial", italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN, space: 2 } },
      children: [new TextRun({ text: " ", size: 10 })],
    })
  );

  // ── Período e total ──
  const infoW  = PAGE_W;
  const col1   = Math.round(infoW * 0.32);
  const col2   = infoW - col1;

  children.push(
    new Table({
      width:        { size: infoW, type: WidthType.DXA },
      columnWidths: [col1, col2],
      borders:      noBorder(),
      rows: [
        new TableRow({ children: [
          new TableCell({ width: { size: col1, type: WidthType.DXA }, borders: noBorder(), shading: { fill: SLATE_50, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Período", bold: true, size: 18, color: SLATE_500, font: "Arial" })] })] }),
          new TableCell({ width: { size: col2, type: WidthType.DXA }, borders: noBorder(), margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: periodoLabel, size: 18, color: BLACK, font: "Arial" })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ width: { size: col1, type: WidthType.DXA }, borders: noBorder(), shading: { fill: SLATE_50, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Total de registros", bold: true, size: 18, color: SLATE_500, font: "Arial" })] })] }),
          new TableCell({ width: { size: col2, type: WidthType.DXA }, borders: noBorder(), margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: `${logs.length}`, size: 18, color: BLACK, font: "Arial" })] })] }),
        ]}),
        new TableRow({ children: [
          new TableCell({ width: { size: col1, type: WidthType.DXA }, borders: noBorder(), shading: { fill: SLATE_50, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Gerado em", bold: true, size: 18, color: SLATE_500, font: "Arial" })] })] }),
          new TableCell({ width: { size: col2, type: WidthType.DXA }, borders: noBorder(), margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: now, size: 18, color: BLACK, font: "Arial" })] })] }),
        ]}),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { before: 240, after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 1 } }, children: [new TextRun({ text: "REGISTROS", bold: true, size: 22, color: GREEN, font: "Arial" })] }));

  // ── Tabela de logs ──
  if (logs.length === 0) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: "Nenhuma atividade encontrada no período.", size: 18, color: SLATE_500, font: "Arial", italics: true })],
      })
    );
  } else {
    const c1 = Math.round(PAGE_W * 0.18); // Data/hora
    const c2 = Math.round(PAGE_W * 0.22); // Usuário
    const c3 = Math.round(PAGE_W * 0.20); // Ação
    const c4 = PAGE_W - c1 - c2 - c3;    // Descrição

    children.push(
      new Table({
        width:        { size: PAGE_W, type: WidthType.DXA },
        columnWidths: [c1, c2, c3, c4],
        rows: [
          // Header
          new TableRow({
            tableHeader: true,
            children: [
              cell("Data / Hora",  { bold: true, color: SLATE_500, bg: SLATE_50, width: c1 }),
              cell("Usuário",      { bold: true, color: SLATE_500, bg: SLATE_50, width: c2 }),
              cell("Ação",         { bold: true, color: SLATE_500, bg: SLATE_50, width: c3 }),
              cell("Descrição",    { bold: true, color: SLATE_500, bg: SLATE_50, width: c4 }),
            ],
          }),
          // Linhas de dados
          ...logs.map((log, i) =>
            new TableRow({
              children: [
                cell(fmtDate(log.createdAt), { width: c1, bg: i % 2 === 0 ? "FFFFFF" : SLATE_50 }),
                new TableCell({
                  width:   { size: c2, type: WidthType.DXA },
                  borders: allBorders(SLATE_200),
                  shading: { fill: i % 2 === 0 ? "FFFFFF" : SLATE_50, type: ShadingType.CLEAR },
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: log.user.name, bold: true, size: 16, color: BLACK, font: "Arial" })] }),
                    new Paragraph({ spacing: { before: 20, after: 0 }, children: [new TextRun({ text: log.user.email, size: 14, color: SLATE_500, font: "Arial" })] }),
                  ],
                }),
                cell(ACTION_LABELS[log.action] ?? log.action, {
                  width: c3,
                  color: log.action.includes("APPROVED") ? "166534" :
                         log.action.includes("REJECTED")  ? "B91C1C" :
                         log.action === "USER_LOGIN"       ? "1E40AF" : BLACK,
                  bg:    i % 2 === 0 ? "FFFFFF" : SLATE_50,
                }),
                cell(log.description ?? "—", { width: c4, bg: i % 2 === 0 ? "FFFFFF" : SLATE_50 }),
              ],
            })
          ),
        ],
      })
    );
  }

  // ── Rodapé do conteúdo ──
  children.push(
    new Paragraph({ spacing: { before: 320 }, border: { top: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 2 } }, children: [new TextRun({ text: " ", size: 10 })] }),
    new Paragraph({ children: [new TextRun({ text: `Relatório gerado automaticamente pelo sistema ICMS-ECO em ${now}.`, size: 16, color: SLATE_500, font: "Arial", italics: true })] }),
  );

  // ── Monta o documento ──
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    sections: [{
      properties: {
        page: {
          size:   { width: 11906, height: 16838 }, // A4
          margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200, space: 1 } },
              children: [new TextRun({ text: `Relatório de Atividades · ICMS-ECO · ${periodoLabel}`, size: 16, color: SLATE_500, font: "Arial" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200, space: 1 } },
              children: [
                new TextRun({ text: "Página ", size: 16, color: SLATE_500, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: SLATE_500, font: "Arial" }),
                new TextRun({ text: " de ", size: 16, color: SLATE_500, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: SLATE_500, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  const buffer   = await Packer.toBuffer(doc);
  const safePeriod = (from || to)
    ? `_${(from ?? "").replace(/-/g, "") || "inicio"}_a_${(to ?? "").replace(/-/g, "") || "hoje"}`
    : "";
  const fileName = `Atividades_ICMS-ECO${safePeriod}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
