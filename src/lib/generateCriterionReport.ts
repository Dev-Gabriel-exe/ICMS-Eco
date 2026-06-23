// src/lib/generateCriterionReport.ts
// Gera um .docx de comprovação com todos os documentos aprovados de um critério
// Usa a lib `docx` instalada via: npm install docx

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, HeadingLevel,
  LevelFormat, PageNumber, Footer, Header,
} from "docx";
import type { Criteria, ChecklistItem, Evidence, CriteriaSubDoc } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STATUS_LABEL: Record<string, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  complete:    "Completo",
  returned:    "Devolvido",
  pending:     "Aguardando análise",
  approved:    "Aprovado",
  rejected:    "Reprovado",
};

// Cores (hex sem #)
const COLOR = {
  green:      "1A7A4A",
  greenLight: "E8F5EE",
  greenBorder:"A8D5B8",
  amber:      "B45309",
  amberLight: "FEF3C7",
  red:        "B91C1C",
  redLight:   "FEE2E2",
  slate:      "475569",
  slateLight: "F8FAFC",
  slateBorder:"E2E8F0",
  white:      "FFFFFF",
  black:      "0F172A",
  blue:       "1E40AF",
  blueLight:  "EFF6FF",
};

const border = (color = COLOR.slateBorder) => ({
  style: BorderStyle.SINGLE, size: 1, color,
});
const borders = (color?: string) => {
  const b = border(color);
  return { top: b, bottom: b, left: b, right: b };
};
const noBorder = () => {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b };
};

// Largura da página A4 com margens de 2cm ≈ 8958 DXA (1 inch = 1440 DXA)
const PAGE_WIDTH = 8958; // DXA

function p(
  text: string,
  opts: {
    bold?: boolean; size?: number; color?: string; spacing?: number;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    italic?: boolean; heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
  } = {}
): Paragraph {
  return new Paragraph({
    heading:   opts.heading,
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing:   { after: opts.spacing ?? 80 },
    children:  [
      new TextRun({
        text,
        bold:   opts.bold   ?? false,
        size:   opts.size   ?? 20,  // 10pt default
        color:  opts.color  ?? COLOR.black,
        font:   "Arial",
        italics: opts.italic ?? false,
      }),
    ],
  });
}

function spacer(before = 120): Paragraph {
  return new Paragraph({ spacing: { before, after: 0 }, children: [] });
}

function sectionTitle(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.green, space: 1 } },
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: COLOR.green, font: "Arial" }),
    ],
  });
}

function infoRow(label: string, value: string, tableWidth = PAGE_WIDTH): Table {
  const labelW = Math.round(tableWidth * 0.32);
  const valueW = tableWidth - labelW;
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: [labelW, valueW],
    borders: noBorder(),
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelW, type: WidthType.DXA },
            borders: noBorder(),
            shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: COLOR.slate, font: "Arial" })] })],
          }),
          new TableCell({
            width: { size: valueW, type: WidthType.DXA },
            borders: noBorder(),
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: value || "—", size: 18, color: COLOR.black, font: "Arial" })] })],
          }),
        ],
      }),
    ],
  });
}

// ─── Bloco de evidência aprovada ──────────────────────────────────────────────

function evidenceBlock(ev: Evidence, index: number): (Paragraph | Table)[] {
  const uploaderName  = (ev as any).uploader?.name  ?? "—";
  const uploaderEmail = (ev as any).uploader?.email ?? "";
  const validatorName = (ev as any).validator?.name ?? "—";
  const subDocLabel   = (ev as any).subDoc?.label   ?? "Documento genérico";

  const rows: (Paragraph | Table)[] = [];

  // Cabeçalho do arquivo
  rows.push(
    new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [PAGE_WIDTH],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: PAGE_WIDTH, type: WidthType.DXA },
              borders: borders(COLOR.greenBorder),
              shading: { fill: COLOR.greenLight, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${index}. `, bold: true, size: 20, color: COLOR.green, font: "Arial" }),
                    new TextRun({ text: ev.fileName, bold: true, size: 20, color: COLOR.green, font: "Arial" }),
                  ],
                }),
                new Paragraph({
                  spacing: { before: 40, after: 0 },
                  children: [
                    new TextRun({ text: subDocLabel, size: 18, color: COLOR.slate, font: "Arial", italics: true }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Tabela de metadados
  const metaW = PAGE_WIDTH;
  const col1  = Math.round(metaW * 0.25);
  const col2  = Math.round(metaW * 0.25);
  const col3  = Math.round(metaW * 0.25);
  const col4  = metaW - col1 - col2 - col3;

  const cellStyle = (text: string, bold = false, color = COLOR.black) =>
    new TableCell({
      width: { size: col1, type: WidthType.DXA },
      borders: borders(COLOR.slateBorder),
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text, bold, size: 17, color, font: "Arial" })] })],
    });

  rows.push(
    new Table({
      width: { size: metaW, type: WidthType.DXA },
      columnWidths: [col1, col2, col3, col4],
      rows: [
        // Header row
        new TableRow({
          children: [
            new TableCell({ width: { size: col1, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tipo/Tamanho", bold: true, size: 17, color: COLOR.slate, font: "Arial" })] })] }),
            new TableCell({ width: { size: col2, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Enviado por", bold: true, size: 17, color: COLOR.slate, font: "Arial" })] })] }),
            new TableCell({ width: { size: col3, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Data do envio", bold: true, size: 17, color: COLOR.slate, font: "Arial" })] })] }),
            new TableCell({ width: { size: col4, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Aprovado por / Data", bold: true, size: 17, color: COLOR.slate, font: "Arial" })] })] }),
          ],
        }),
        // Data row
        new TableRow({
          children: [
            cellStyle(`${ev.fileType?.split("/")[1]?.toUpperCase() ?? "—"} · ${fmtSize(ev.fileSizeBytes)}`),
            new TableCell({
              width: { size: col2, type: WidthType.DXA }, borders: borders(COLOR.slateBorder),
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: uploaderName, bold: true, size: 17, color: COLOR.black, font: "Arial" })] }),
                new Paragraph({ spacing: { before: 20, after: 0 }, children: [new TextRun({ text: uploaderEmail, size: 15, color: COLOR.slate, font: "Arial" })] }),
              ],
            }),
            cellStyle(fmtDate(ev.uploadedAt)),
            new TableCell({
              width: { size: col4, type: WidthType.DXA }, borders: borders(COLOR.greenBorder),
              shading: { fill: COLOR.greenLight, type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              children: [
                new Paragraph({ children: [new TextRun({ text: validatorName, bold: true, size: 17, color: COLOR.green, font: "Arial" })] }),
                new Paragraph({ spacing: { before: 20, after: 0 }, children: [new TextRun({ text: fmtDate(ev.validatedAt), size: 15, color: COLOR.green, font: "Arial" })] }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Link do arquivo
  rows.push(
    new Paragraph({
      spacing: { before: 60, after: 100 },
      children: [
        new TextRun({ text: "URL: ", bold: true, size: 17, color: COLOR.slate, font: "Arial" }),
        new TextRun({ text: ev.fileUrl, size: 17, color: COLOR.blue, font: "Arial" }),
      ],
    })
  );

  // Comentário de revisão, se houver
  if (ev.reviewComment) {
    rows.push(
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [PAGE_WIDTH],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: PAGE_WIDTH, type: WidthType.DXA },
                borders: borders(COLOR.greenBorder),
                shading: { fill: COLOR.greenLight, type: ShadingType.CLEAR },
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  new Paragraph({ children: [
                    new TextRun({ text: "Obs. do revisor: ", bold: true, size: 17, color: COLOR.green, font: "Arial" }),
                    new TextRun({ text: ev.reviewComment, size: 17, color: COLOR.black, font: "Arial" }),
                  ]}),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  return rows;
}

// ─── Entrada principal ────────────────────────────────────────────────────────

export interface ReportInput {
  criterion:      Criteria;
  item:           ChecklistItem | undefined;
  evidences:      Evidence[];
  municipalityName: string;
  certameYear:    number;
}

export async function generateCriterionReport({
  criterion, item, evidences, municipalityName, certameYear,
}: ReportInput): Promise<void> {
  const approvedEvidences = evidences.filter(e => e.validationStatus === "approved");
  const allEvidences      = evidences; // todas, para o resumo

  const now        = fmtDate(new Date());
  const itemStatus = STATUS_LABEL[item?.status ?? "not_started"];

  // Agrupa aprovados por subDoc
  const subDocGroups: Map<string, { label: string; evidences: Evidence[] }> = new Map();
  const genericApproved: Evidence[] = [];

  for (const ev of approvedEvidences) {
    if (ev.subDocId) {
      const label = (ev as any).subDoc?.label ?? ev.subDocId;
      if (!subDocGroups.has(ev.subDocId)) {
        subDocGroups.set(ev.subDocId, { label, evidences: [] });
      }
      subDocGroups.get(ev.subDocId)!.evidences.push(ev);
    } else {
      genericApproved.push(ev);
    }
  }

  // ── Constrói o documento ────────────────────────────────────────────────────

  const children: (Paragraph | Table)[] = [];

  // ── Cabeçalho ──
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({ text: "RELATÓRIO DE COMPROVAÇÃO", bold: true, size: 32, color: COLOR.green, font: "Arial" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({ text: "Selo Ambiental — Decreto Estadual nº 24.288/2025 · SEMARH-PI", size: 18, color: COLOR.slate, font: "Arial" }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR.green, space: 2 } },
      children: [new TextRun({ text: " ", size: 10 })],
    })
  );

  // ── Dados gerais ──
  children.push(sectionTitle("1. IDENTIFICAÇÃO"));
  children.push(infoRow("Município",         municipalityName));
  children.push(infoRow("Certame",           `${certameYear}`));
  children.push(infoRow("Eixo",              `${criterion.axis} — ${criterion.axisName}`));
  children.push(infoRow("Critério",          `${criterion.id} — ${criterion.description}`));
  children.push(infoRow("Status do critério", itemStatus));
  children.push(infoRow("Pontuação máxima",  `${criterion.maxPoints} pts`));
  children.push(infoRow("Gerado em",         now));
  children.push(spacer(200));

  // ── Requisito ──
  children.push(sectionTitle("2. REQUISITO (Decreto 24.288/2025)"));
  children.push(
    new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [PAGE_WIDTH],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: PAGE_WIDTH, type: WidthType.DXA },
              borders: borders(COLOR.slateBorder),
              shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [new Paragraph({ children: [new TextRun({ text: criterion.requirement, size: 19, color: COLOR.black, font: "Arial" })] })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(spacer(120));

  // ── Documentação exigida ──
  children.push(sectionTitle("3. DOCUMENTAÇÃO COMPROBATÓRIA EXIGIDA"));
  children.push(
    new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [PAGE_WIDTH],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: PAGE_WIDTH, type: WidthType.DXA },
              borders: borders(COLOR.slateBorder),
              shading: { fill: COLOR.blueLight, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [new Paragraph({ children: [new TextRun({ text: criterion.requiredDocs, size: 18, color: COLOR.black, font: "Arial" })] })],
            }),
          ],
        }),
      ],
    })
  );
  children.push(spacer(120));

  // ── Resumo de status ──
  children.push(sectionTitle("4. RESUMO DOS DOCUMENTOS ENVIADOS"));

  const totalSent     = allEvidences.length;
  const totalApproved = allEvidences.filter(e => e.validationStatus === "approved").length;
  const totalPending  = allEvidences.filter(e => e.validationStatus === "pending").length;
  const totalRejected = allEvidences.filter(e => e.validationStatus === "rejected").length;

  const colW = Math.round(PAGE_WIDTH / 4);
  children.push(
    new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA },
      columnWidths: [colW, colW, colW, PAGE_WIDTH - colW * 3],
      rows: [
        new TableRow({
          children: [
            new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalSent}`, bold: true, size: 28, color: COLOR.slate, font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Total enviados", size: 17, color: COLOR.slate, font: "Arial" })] })] }),
            new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: borders(COLOR.greenBorder), shading: { fill: COLOR.greenLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalApproved}`, bold: true, size: 28, color: COLOR.green, font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aprovados", size: 17, color: COLOR.green, font: "Arial" })] })] }),
            new TableCell({ width: { size: colW, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.amberLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalPending}`, bold: true, size: 28, color: COLOR.amber, font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pendentes", size: 17, color: COLOR.amber, font: "Arial" })] })] }),
            new TableCell({ width: { size: PAGE_WIDTH - colW * 3, type: WidthType.DXA }, borders: borders(COLOR.slateBorder), shading: { fill: COLOR.redLight, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${totalRejected}`, bold: true, size: 28, color: COLOR.red, font: "Arial" })] }), new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Reprovados", size: 17, color: COLOR.red, font: "Arial" })] })] }),
          ],
        }),
      ],
    })
  );
  children.push(spacer(200));

  // ── Documentos aprovados ──
  children.push(sectionTitle("5. DOCUMENTOS APROVADOS"));

  if (approvedEvidences.length === 0) {
    children.push(
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: [PAGE_WIDTH],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: PAGE_WIDTH, type: WidthType.DXA },
                borders: borders(COLOR.slateBorder),
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Nenhum documento aprovado até o momento.", size: 18, color: COLOR.slate, font: "Arial", italics: true })] })],
              }),
            ],
          }),
        ],
      })
    );
  } else {
    let idx = 1;

    // Por sub-documento
    for (const [, group] of subDocGroups) {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [new TextRun({ text: group.label, bold: true, size: 20, color: COLOR.slate, font: "Arial" })],
        })
      );
      for (const ev of group.evidences) {
        children.push(...evidenceBlock(ev, idx++));
        children.push(spacer(80));
      }
    }

    // Genéricos (sem subDoc)
    if (genericApproved.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [new TextRun({ text: "Outros documentos", bold: true, size: 20, color: COLOR.slate, font: "Arial" })],
        })
      );
      for (const ev of genericApproved) {
        children.push(...evidenceBlock(ev, idx++));
        children.push(spacer(80));
      }
    }
  }

  // ── Checklist de qualidade (se houver campos preenchidos) ──
  const hasQuality = approvedEvidences.some(e =>
    e.hasDate !== null || e.hasGeotag !== null || e.isPdfSearchable !== null ||
    e.hasElectronicSignature !== null || e.followsAnnexII !== null || e.isOriginalDoc !== null
  );

  if (hasQuality) {
    children.push(spacer(200));
    children.push(sectionTitle("6. CHECKLIST DE QUALIDADE DOS DOCUMENTOS"));

    const qColW  = Math.round(PAGE_WIDTH / 7);
    const qCols  = [qColW, qColW, qColW, qColW, qColW, qColW, PAGE_WIDTH - qColW * 6];

    const bool2str = (v: boolean | null | undefined) =>
      v === true ? "✓ Sim" : v === false ? "✗ Não" : "—";

    children.push(
      new Table({
        width: { size: PAGE_WIDTH, type: WidthType.DXA },
        columnWidths: qCols,
        rows: [
          new TableRow({
            children: [
              ...(["Arquivo", "Com data", "Geotag", "PDF pesquisável", "Assinatura elétron.", "Anexo II", "Doc original"] as string[]).map((h, i) =>
                new TableCell({
                  width: { size: qCols[i], type: WidthType.DXA },
                  borders: borders(COLOR.slateBorder),
                  shading: { fill: COLOR.slateLight, type: ShadingType.CLEAR },
                  margins: { top: 60, bottom: 60, left: 80, right: 80 },
                  children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 15, color: COLOR.slate, font: "Arial" })] })],
                })
              ),
            ],
          }),
          ...approvedEvidences.map(ev =>
            new TableRow({
              children: [
                new TableCell({ width: { size: qCols[0], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: ev.fileName, size: 15, color: COLOR.black, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[1], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.hasDate), size: 15, color: ev.hasDate ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[2], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.hasGeotag), size: 15, color: ev.hasGeotag ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[3], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.isPdfSearchable), size: 15, color: ev.isPdfSearchable ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[4], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.hasElectronicSignature), size: 15, color: ev.hasElectronicSignature ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[5], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.followsAnnexII), size: 15, color: ev.followsAnnexII ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
                new TableCell({ width: { size: qCols[6], type: WidthType.DXA }, borders: borders(COLOR.slateBorder), margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: bool2str(ev.isOriginalDoc), size: 15, color: ev.isOriginalDoc ? COLOR.green : COLOR.red, font: "Arial" })] })] }),
              ],
            })
          ),
        ],
      })
    );
  }

  // ── Rodapé do documento ──
  children.push(spacer(300));
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 60 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLOR.green, space: 2 } },
      children: [new TextRun({ text: " ", size: 10 })],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Documento gerado automaticamente pelo Sistema de Gestão do Selo Ambiental · SEMARH-PI", size: 16, color: COLOR.slate, font: "Arial", italics: true }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Gerado em: ${now}  ·  Decreto Estadual nº 24.288/2025`, size: 16, color: COLOR.slate, font: "Arial", italics: true }),
      ],
    })
  );

  // ── Monta o documento ──────────────────────────────────────────────────────

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Arial", size: 20 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // ~2cm
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR.slateBorder, space: 1 } },
              children: [
                new TextRun({ text: `Relatório de Comprovação · ${criterion.id} · ${municipalityName}`, size: 16, color: COLOR.slate, font: "Arial" }),
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
              border: { top: { style: BorderStyle.SINGLE, size: 2, color: COLOR.slateBorder, space: 1 } },
              children: [
                new TextRun({ text: "Página ", size: 16, color: COLOR.slate, font: "Arial" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: COLOR.slate, font: "Arial" }),
                new TextRun({ text: " de ", size: 16, color: COLOR.slate, font: "Arial" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: COLOR.slate, font: "Arial" }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
  });

  // ── Download ───────────────────────────────────────────────────────────────

  const buffer = await Packer.toBlob(doc);
  const url    = URL.createObjectURL(buffer);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = `relatorio_${criterion.id}_${municipalityName.replace(/\s+/g, "_")}_${certameYear}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}