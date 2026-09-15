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
const SHADE = "#d9d9d9";
const SHADE_SOFT = "#efefef";

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
 * The format's signature two-column row. Rendered as a real table so the
 * label column sizes to its widest content across the whole section — a
 * one-word organisation shouldn't reserve the same gutter as a long one.
 * `width: 1px` plus `nowrap` is the standard CSS shrink-to-fit trick, and it
 * mirrors the autofit table the exporter builds.
 */
function EntryTable({ entries, labelKeys, bulletsEnabled }: { entries: ResumeEntry[]; labelKeys: string[]; bulletsEnabled: boolean }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {entries.map((entry) => {
          const labels = labelKeys.map((key) => entry.fields[key]).filter(Boolean);
          if (labels.length === 0 && entry.bullets.length === 0) return null;
          return (
            <tr key={entry.id} style={{ borderBottom: `1px solid ${SHADE_SOFT}` }}>
              <td className="whitespace-nowrap py-[4px] pr-4 align-top" style={{ width: 1 }}>
                {labels.map((label, i) => (
                  <div
                    key={i}
                    className={i === 0 ? "text-[10.5px] font-bold leading-[1.35]" : "text-[10px] leading-[1.35]"}
                    style={{ color: i === 0 ? INK : MUTED }}
                  >
                    {label}
                  </div>
                ))}
              </td>
              <td className="py-[4px] align-top">{bulletsEnabled && <Bullets bullets={entry.bullets} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      className="mb-1 mt-3 px-2 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.06em]"
      style={{ color: INK, background: SHADE, border: `1px solid ${RULE}` }}
    >
      {title}
    </h2>
  );
}

const EDUCATION_COLS = [
  { key: "degree", label: "Degree" },
  { key: "institute", label: "Institute/School" },
  { key: "grade", label: "CGPA/Grade" },
  { key: "remarks", label: "Remarks" },
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
              style={{ borderColor: RULE, background: SHADE }}
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
                <EntryTable
                  entries={section.entries}
                  labelKeys={def.fields.map((f) => f.key)}
                  bulletsEnabled={def.hasBullets}
                />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
