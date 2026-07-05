// src/app/api/relatorios/municipio/[municipioId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  PageNumber,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
} from "docx";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateMunicipalityScore, getSeloLabel } from "@/lib/scoring";
import { formatDate } from "@/lib/utils";
import type { ChecklistItem, Criteria } from "@/types";

const GREEN = "166534";
const GREEN_LIGHT = "F0FDF4";
const SLATE_500 = "64748B";
const SLATE_200 = "E2E8F0";
const SLATE_50 = "F8FAFC";
const BLACK = "0F172A";

function border(color = SLATE_200) {
  return { style: BorderStyle.SINGLE, size: 1, color };
}

function allBorders(color = SLATE_200) {
  const b = border(color);
  return { top: b, bottom: b, left: b, right: b };
}

function labelCell(text: string) {
  return new TableCell({
    width: { size: 34, type: WidthType.PERCENTAGE },
    borders: allBorders(),
    shading: { type: ShadingType.CLEAR, fill: SLATE_50 },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18, color: SLATE_500, font: "Arial" })],
      }),
    ],
  });
}

function valueCell(text: string) {
  return new TableCell({
    width: { size: 66, type: WidthType.PERCENTAGE },
    borders: allBorders(),
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || "—", size: 18, color: BLACK, font: "Arial" })],
      }),
    ],
  });
}

function metricCell(text: string, bold = false, bg = "FFFFFF", color = BLACK) {
  return new TableCell({
    width: { size: 0, type: WidthType.DXA },
    borders: allBorders(),
    shading: { type: ShadingType.CLEAR, fill: bg },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold, size: 17, color, font: "Arial" })],
      }),
    ],
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { municipioId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Não autenticado" }, { status: 401 });
  }

  const municipioId = params.municipioId;

  const [municipality, activeCertame, criteria] = await Promise.all([
    db.municipality.findUnique({
      where: { id: municipioId },
      include: {
        userMunicipalities: {
          include: { user: { select: { name: true, email: true, role: true } } },
        },
      },
    }),
    db.certame.findFirst({ where: { isActive: true, isClosed: false }, orderBy: { year: "desc" } }),
    db.criteria.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!municipality) {
    return NextResponse.json({ success: false, error: "Município não encontrado" }, { status: 404 });
  }

  if (!activeCertame) {
    return NextResponse.json({ success: false, error: "Nenhum certame ativo" }, { status: 400 });
  }

  const allowed = session.user.role === "admin" ||
    session.user.role === "reviewer" ||
    municipality.userMunicipalities.some((link) => link.userId === session.user.id);

  if (!allowed) {
    return NextResponse.json({ success: false, error: "Sem acesso a este município" }, { status: 403 });
  }

  const items = await db.checklistItem.findMany({
    where: { municipalityId: municipioId, certameId: activeCertame.id },
    include: {
      criteria: true,
      evidences: { where: { validationStatus: "approved" }, select: { id: true } },
    },
  });

  const score = calculateMunicipalityScore(
    municipality.id,
    activeCertame.id,
    criteria as unknown as Criteria[],
    items as unknown as ChecklistItem[],
    municipality.population,
  );

  const now = formatDate(new Date());
  const totalEvidenceCount = items.reduce((acc, item) => acc + item.evidences.length, 0);
  const responsibleUsers = municipality.userMunicipalities.map((link) => link.user.name).join(", ") || "—";

  const headerRows = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "RELATÓRIO MUNICIPAL ICMS-ECO", bold: true, size: 30, color: GREEN, font: "Arial" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({ text: `Município de ${municipality.name} · Certame ${activeCertame.year}`, size: 18, color: SLATE_500, font: "Arial", italics: true }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GREEN, space: 2 } },
      children: [new TextRun({ text: " ", size: 10 })],
    }),
  ];

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders(),
    rows: [
      new TableRow({ children: [labelCell("Município"), valueCell(municipality.name)] }),
      new TableRow({ children: [labelCell("População"), valueCell(`${municipality.population.toLocaleString("pt-BR")} hab.`)] }),
      new TableRow({ children: [labelCell("Certame"), valueCell(`${activeCertame.year}`)] }),
      new TableRow({ children: [labelCell("Período"), valueCell(`${formatDate(activeCertame.periodoInicio)} → ${formatDate(activeCertame.periodoFim)}`)] }),
      new TableRow({ children: [labelCell("Responsáveis vinculados"), valueCell(responsibleUsers)] }),
      new TableRow({ children: [labelCell("Pontuação total"), valueCell(`${score.totalPoints} pts`)] }),
      new TableRow({ children: [labelCell("Critérios atingidos"), valueCell(`${score.criteriaMet} de 9`)] }),
      new TableRow({ children: [labelCell("Selo estimado"), valueCell(getSeloLabel(score.seloEstimado))] }),
      new TableRow({ children: [labelCell("Evidências aprovadas"), valueCell(`${totalEvidenceCount}`)] }),
      new TableRow({ children: [labelCell("Gerado em"), valueCell(now)] }),
    ],
  });

  const axisTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          metricCell("Eixo", true, GREEN_LIGHT, GREEN),
          metricCell("Nome", true, GREEN_LIGHT, GREEN),
          metricCell("Pontos", true, GREEN_LIGHT, GREEN),
          metricCell("Meta", true, GREEN_LIGHT, GREEN),
          metricCell("Status", true, GREEN_LIGHT, GREEN),
        ],
      }),
      ...score.axes.map((axis, idx) =>
        new TableRow({
          children: [
            metricCell(axis.axis, true, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(axis.axisName, false, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(`${axis.points}`, false, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(
              `${Math.max(
                (criteria as unknown as Criteria[]).filter((c) => c.axis === axis.axis).reduce((min, c) => Math.min(min, c.axisMinPoints), 50),
                0
              )} pts`,
              false,
              idx % 2 === 0 ? "FFFFFF" : SLATE_50
            ),
            metricCell(axis.criteriaMet ? "Atingido" : "Não atingido", true, idx % 2 === 0 ? "FFFFFF" : SLATE_50, axis.criteriaMet ? GREEN : "B91C1C"),
          ],
        })
      ),
    ],
  });

  const criteriaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          metricCell("Critério", true, GREEN_LIGHT, GREEN),
          metricCell("Descrição", true, GREEN_LIGHT, GREEN),
          metricCell("Status", true, GREEN_LIGHT, GREEN),
          metricCell("Pontos", true, GREEN_LIGHT, GREEN),
        ],
      }),
      ...items.map((item, idx) =>
        new TableRow({
          children: [
            metricCell(item.criteria.id, true, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(item.criteria.description, false, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(item.status === "complete" ? "Completo" : item.status === "in_progress" ? "Em andamento" : "Não iniciado", true, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
            metricCell(item.pointsClaimed != null ? `${item.pointsClaimed} pts` : "—", false, idx % 2 === 0 ? "FFFFFF" : SLATE_50),
          ],
        })
      ),
    ],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 900, right: 900, bottom: 900, left: 900 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: SLATE_200, space: 1 } },
              children: [
                new TextRun({ text: `Relatório Municipal · ICMS-ECO · ${municipality.name}`, size: 16, color: SLATE_500, font: "Arial" }),
              ],
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
      children: [
        ...headerRows,
        new Paragraph({
          spacing: { after: 120, before: 80 },
          children: [new TextRun({ text: "RESUMO GERAL", bold: true, size: 22, color: GREEN, font: "Arial" })],
        }),
        summaryTable,
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "PONTUAÇÃO POR EIXO", bold: true, size: 22, color: GREEN, font: "Arial" })],
        }),
        axisTable,
        new Paragraph({
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: "DETALHAMENTO DOS CRITÉRIOS", bold: true, size: 22, color: GREEN, font: "Arial" })],
        }),
        criteriaTable,
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const fileName = `Relatorio_Municipal_${municipality.name.replace(/[\\/:*?"<>|]/g, "_")}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
