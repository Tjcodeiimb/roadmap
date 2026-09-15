import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { filledSections, sectionDef } from "./sections";
import type { ResumeDoc, ResumeEntry } from "./types";

// Builds the .docx in the same shape as the source format: a borderless
// two-column table per entry (narrow label block on the left, bullets on the
// right), and a real bordered table for academic qualifications. That's how
// the format achieves its alignment in Word — tab stops drift as soon as a
// label runs long, table cells don't.

const FONT = "Calibri";
const BODY_SIZE = 19; // half-points, so 9.5pt — the format runs tight to fit one page
const HEADING_SIZE = 20;
const NAME_SIZE = 32;

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" } as const;
const HAIRLINE = { style: BorderStyle.SINGLE, size: 4, color: "111111" } as const;

const BORDERLESS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const BOXED = {
  top: HAIRLINE,
  bottom: HAIRLINE,
  left: HAIRLINE,
  right: HAIRLINE,
  insideHorizontal: HAIRLINE,
  insideVertical: HAIRLINE,
};

function text(value: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new TextRun({
    text: value,
    bold: opts.bold,
    size: opts.size ?? BODY_SIZE,
    color: opts.color ?? "111111",
    font: FONT,
  });
}

function line(value: string, opts: { bold?: boolean; size?: number; color?: string } = {}) {
  return new Paragraph({ children: [text(value, opts)], spacing: { before: 0, after: 0 } });
}

function sectionHeading(title: string) {
  return new Paragraph({
    children: [text(title.toUpperCase(), { bold: true, size: HEADING_SIZE })],
    spacing: { before: 160, after: 60 },
    border: { bottom: HAIRLINE },
  });
}

function bullet(value: string) {
  return new Paragraph({
    children: [text(value)],
    bullet: { level: 0 },
    spacing: { before: 0, after: 0 },
  });
}

function entryRow(entry: ResumeEntry, labelKeys: string[], withBullets: boolean) {
  const labels = labelKeys.map((key) => entry.fields[key]).filter(Boolean);

  const leftParagraphs = labels.length
    ? labels.map((label, i) => line(label, { bold: i === 0, color: i === 0 ? "111111" : "444444" }))
    : [line("")];

  const rightParagraphs = withBullets && entry.bullets.length ? entry.bullets.map(bullet) : [line("")];

  return new TableRow({
    children: [
      new TableCell({
        children: leftParagraphs,
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: { top: 40, bottom: 40, left: 0, right: 120 },
      }),
      new TableCell({
        children: rightParagraphs,
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: { top: 40, bottom: 40, left: 0, right: 0 },
      }),
    ],
  });
}

const EDUCATION_COLS: { key: string; label: string }[] = [
  { key: "degree", label: "Degree" },
  { key: "institute", label: "Institute/School" },
  { key: "grade", label: "CGPA/Grade" },
  { key: "remarks", label: "Remarks" },
  { key: "year", label: "Year" },
];

function educationTable(entries: ResumeEntry[]) {
  const header = new TableRow({
    tableHeader: true,
    children: EDUCATION_COLS.map(
      (col) =>
        new TableCell({
          children: [line(col.label, { bold: true })],
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
        })
    ),
  });

  const rows = entries.map(
    (entry) =>
      new TableRow({
        children: EDUCATION_COLS.map(
          (col) =>
            new TableCell({
              children: [line(entry.fields[col.key] || "–")],
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
            })
        ),
      })
  );

  return new Table({
    rows: [header, ...rows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BOXED,
  });
}

export async function buildResumeDocx(doc: ResumeDoc): Promise<Buffer> {
  const { header } = doc;
  const contact = [header.gender, header.age, header.phone, header.email, header.linkedin]
    .filter(Boolean)
    .join("  |  ");

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      children: [text(header.fullName || "Your name", { bold: true, size: NAME_SIZE })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  ];

  if (contact) {
    children.push(
      new Paragraph({
        children: [text(contact, { color: "444444" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }

  for (const section of filledSections(doc)) {
    const def = sectionDef(section.type);
    if (!def) continue;

    children.push(sectionHeading(section.title || def.title));

    if (def.layout === "table") {
      children.push(educationTable(section.entries));
    } else if (def.layout === "skills") {
      const names = section.entries.map((e) => e.fields.name).filter(Boolean);
      if (names.length) children.push(line(names.join("  ·  ")));
    } else {
      children.push(
        new Table({
          rows: section.entries.map((entry) =>
            entryRow(
              entry,
              def.fields.map((f) => f.key),
              def.hasBullets
            )
          ),
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: BORDERLESS,
        })
      );
    }
  }

  const file = new Document({
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
    sections: [
      {
        properties: {
          page: {
            // A4 with half-inch margins — the format runs edge-to-edge to fit
            // everything on one page.
            size: { width: 11906, height: 16838 },
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(file);
}

/** "Shardul Singh" -> "Shardul_Singh_Resume.docx" */
export function resumeFilename(fullName: string): string {
  const base = fullName.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
  return `${base || "Resume"}_Resume.docx`.replace(/_Resume_Resume/, "_Resume");
}
