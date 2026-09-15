import { filledSections, sectionDef } from "@/lib/resume/sections";
import type { ResumeDoc, ResumeEntry } from "@/lib/resume/types";

// This is a document preview, not app chrome — so it deliberately does NOT
// use the app's neo-brutalist tokens or follow the theme. It's a white page
// with black text in both light and dark mode, because it has to look like
// what comes out of the .docx. Every colour here is fixed for that reason.

const PAPER = "#ffffff";
const INK = "#111111";
const MUTED = "#444444";
const RULE = "#111111";

function Bullets({ bullets }: { bullets: string[] }) {
  if (bullets.length === 0) return null;
  return (
    <ul className="m-0 list-disc space-y-[2px] pl-4">
      {bullets.map((bullet, i) => (
        <li key={i} className="text-[10.5px] leading-[1.45]" style={{ color: INK }}>
          {bullet}
        </li>
      ))}
    </ul>
  );
}

/**
 * The format's signature two-column row: a narrow left label block (org,
 * role, dates) against the bullets. In the .docx this is a borderless table;
 * here it's a grid with the same proportions.
 */
function EntryRow({ entry, labelKeys, bulletsEnabled }: { entry: ResumeEntry; labelKeys: string[]; bulletsEnabled: boolean }) {
  const labels = labelKeys.map((key) => entry.fields[key]).filter(Boolean);
  if (labels.length === 0 && entry.bullets.length === 0) return null;

  return (
    <div className="grid grid-cols-[30%_1fr] gap-x-3 py-[3px]">
      <div className="min-w-0">
        {labels.map((label, i) => (
          <div
            key={i}
            className={i === 0 ? "text-[10.5px] font-bold leading-[1.35]" : "text-[10px] leading-[1.35]"}
            style={{ color: i === 0 ? INK : MUTED }}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="min-w-0">{bulletsEnabled && <Bullets bullets={entry.bullets} />}</div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      className="mb-1 mt-3 text-[10.5px] font-bold uppercase tracking-[0.06em]"
      style={{ color: INK, borderBottom: `1px solid ${RULE}`, paddingBottom: 2 }}
    >
      {title}
    </h2>
  );
}

const EDUCATION_COLS = [
  { key: "degree", label: "Degree" },
  { key: "institute", label: "Institute/School" },
  { key: "board", label: "Board/University" },
  { key: "grade", label: "CGPA/%" },
  { key: "year", label: "Year" },
];

function EducationTable({ entries }: { entries: ResumeEntry[] }) {
  return (
    <table className="w-full border-collapse text-[10px]" style={{ color: INK }}>
      <thead>
        <tr>
          {EDUCATION_COLS.map((col) => (
            <th
              key={col.key}
              className="border px-1.5 py-[3px] text-left font-bold"
              style={{ borderColor: RULE }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            {EDUCATION_COLS.map((col) => (
              <td key={col.key} className="border px-1.5 py-[3px] align-top" style={{ borderColor: RULE }}>
                {entry.fields[col.key] || "–"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SkillsRow({ entries }: { entries: ResumeEntry[] }) {
  const names = entries.map((e) => e.fields.name).filter(Boolean);
  if (names.length === 0) return null;
  return (
    <p className="text-[10.5px] leading-[1.5]" style={{ color: INK }}>
      {names.join(" · ")}
    </p>
  );
}

/**
 * A4 at 96 CSS px per inch. The exporter uses the same page size and 0.5in
 * margins (720 twips), so these numbers keep the preview dimensionally
 * identical to the .docx — which is what lets the editor measure this
 * element's height and say something true about whether it fits on one page.
 */
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
const A4_MARGIN_PX = 48;

export function ResumePreview({ doc }: { doc: ResumeDoc }) {
  const sections = filledSections(doc);
  const { header } = doc;
  const contactLine = [header.gender, header.age && `${header.age}`, header.phone, header.email, header.linkedin]
    .filter(Boolean)
    .join("  |  ");

  return (
    <div
      data-print-root
      className="mx-auto w-full shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
      style={{ background: PAPER, maxWidth: A4_WIDTH_PX, padding: A4_MARGIN_PX }}
    >
      <header className="text-center">
        <h1 className="text-[17px] font-bold uppercase tracking-[0.08em]" style={{ color: INK }}>
          {header.fullName || "Your name"}
        </h1>
        {contactLine && (
          <p className="mt-1 text-[10px]" style={{ color: MUTED }}>
            {contactLine}
          </p>
        )}
      </header>

      {sections.length === 0 ? (
        <p className="mt-10 text-center text-[11px]" style={{ color: MUTED }}>
          Your resume will appear here as you fill in the sections.
        </p>
      ) : (
        sections.map((section) => {
          const def = sectionDef(section.type);
          if (!def) return null;
          return (
            <section key={section.id}>
              <SectionHeading title={section.title || def.title} />
              {def.layout === "table" ? (
                <EducationTable entries={section.entries} />
              ) : def.layout === "skills" ? (
                <SkillsRow entries={section.entries} />
              ) : (
                section.entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    labelKeys={def.fields.map((f) => f.key)}
                    bulletsEnabled={def.hasBullets}
                  />
                ))
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
