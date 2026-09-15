import { newId, normalizeResumeDoc, type ResumeDoc, type ResumeSection } from "./types";

// The section registry. Three consumers read this one file — the survey (to
// generate its questions), the on-screen preview, and the .docx exporter — so
// adding a section type is a change here and nowhere else, with no migration.
//
// The shapes come from the standard Indian B-school (IIM) CV: every section
// except Academic Qualifications is the same "left label block / right
// bullets" two-column entry, which is why one generic entry model covers all
// but one of them.
//
// The canonical bucket list is Education / Work Experience / Positions of
// Responsibility / Extra-Curricular Activities, with internships, ventures,
// projects, awards and skills alongside. An earlier version of this file was
// derived from a single real CV belonging to an entrepreneur, which left it
// without a Work Experience section at all — most students at these schools
// arrive with one to four years of corporate work, and a founder role belongs
// as an entry inside that bucket rather than as its own permanent section.

export type SectionLayout = "table" | "entries" | "skills";

export interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  /** Narrow fields sit side-by-side in the editor; wide ones take a full row. */
  width?: "full" | "half";
}

export interface SectionDef {
  type: string;
  /** Default heading — uppercase, matching the format's convention. */
  title: string;
  layout: SectionLayout;
  /** One-line explanation shown at the top of this step in the survey. */
  prompt: string;
  fields: FieldDef[];
  hasBullets: boolean;
  maxBullets: number;
  /** Optional sections get a Skip button in the survey. */
  optional: boolean;
  /** Label for the "add another" button, e.g. "internship". */
  entryNoun: string;
}

/**
 * The format's bullets are written to sit on exactly one printed line. Past
 * this the line wraps and the whole CV loses its grid, so the editor warns
 * rather than silently letting it happen. A soft nudge, not a hard rule —
 * one line is the majority convention, two is tolerated.
 */
export const BULLET_SOFT_LIMIT = 135;

/** Three to five bullets per entry is the cross-checked norm. */
const MAX_BULLETS = 5;

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "education",
    title: "ACADEMIC QUALIFICATIONS",
    layout: "table",
    prompt: "Your degrees and schooling, most recent first.",
    fields: [
      { key: "degree", label: "Degree", placeholder: "BBA (DBE)", width: "half" },
      { key: "institute", label: "Institute / School", placeholder: "Indian Institute of Management, Bangalore" },
      // Class X and XII need the examining board recorded separately from the
      // school; degrees need the awarding university.
      { key: "board", label: "Board / University", placeholder: "CBSE", width: "half" },
      { key: "grade", label: "CGPA / %", placeholder: "86.30/100", width: "half" },
      { key: "year", label: "Year", placeholder: "2024-2027", width: "half" },
    ],
    hasBullets: false,
    maxBullets: 0,
    optional: false,
    entryNoun: "qualification",
  },
  {
    type: "work",
    title: "WORK EXPERIENCE",
    layout: "entries",
    prompt: "Full-time roles, most recent first. Quantify every bullet you can.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "Bain & Company" },
      { key: "role", label: "Role", placeholder: "Associate Consultant", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Jun’22 – Mar’24", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "role",
  },
  {
    type: "internships",
    title: "INTERNSHIP EXPERIENCE",
    layout: "entries",
    prompt: "Internships and shorter work stints.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "What Customer Thinks Consulting" },
      { key: "role", label: "Role", placeholder: "Intern", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Sep’24 – Dec’24", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "internship",
  },
  {
    type: "entrepreneurial",
    title: "ENTREPRENEURIAL EXPERIENCE",
    layout: "entries",
    prompt: "Only worth its own section if a venture is a genuine spike on your profile — otherwise put the founder role under Work Experience.",
    fields: [
      { key: "org", label: "Venture", placeholder: "UpForge Consulting" },
      { key: "role", label: "Role", placeholder: "Founder & CEO", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Dec’24 – Present", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "venture",
  },
  {
    type: "positions",
    title: "POSITIONS OF RESPONSIBILITY",
    layout: "entries",
    prompt: "Formal leadership titles — committee, club and society roles.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "BMCC", width: "half" },
      { key: "body", label: "Body / Cell", placeholder: "Entrepreneurship Development Cell", width: "half" },
      { key: "role", label: "Role", placeholder: "Research Dept. Head", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Dec’24 – Present", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "position",
  },
  {
    type: "projects",
    title: "PROJECTS",
    layout: "entries",
    prompt: "Live projects, case competitions and consulting engagements.",
    fields: [
      { key: "name", label: "Project", placeholder: "VIBAe", width: "half" },
      { key: "kind", label: "Type", placeholder: "GTM Analysis", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "project",
  },
  {
    type: "awards",
    title: "ACHIEVEMENTS & AWARDS",
    layout: "entries",
    prompt: "Scholastic honours, competitions, prizes and scholarships — all in one bucket.",
    fields: [{ key: "title", label: "Achievement", placeholder: "B-Plan Comp: IIM Lucknow X CM Yuva" }],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "achievement",
  },
  {
    type: "extracurricular",
    title: "EXTRA-CURRICULAR ACTIVITIES",
    layout: "entries",
    prompt: "Sports, clubs, volunteering — anything without a formal title, which would belong under Positions of Responsibility instead.",
    fields: [
      { key: "activity", label: "Activity", placeholder: "National-level debating" },
      { key: "dates", label: "Duration", placeholder: "2021 – Present", width: "half" },
    ],
    hasBullets: true,
    maxBullets: MAX_BULLETS,
    optional: true,
    entryNoun: "activity",
  },
  {
    type: "skills",
    title: "SKILLS & CERTIFICATIONS",
    layout: "skills",
    prompt: "Add skills by hand, or pull in the ones you’ve unlocked on UpForge.",
    fields: [{ key: "name", label: "Skill", placeholder: "3-Statement Modeling" }],
    hasBullets: false,
    maxBullets: 0,
    optional: true,
    entryNoun: "skill",
  },
];

export const SECTION_BY_TYPE = new Map(SECTION_DEFS.map((def) => [def.type, def]));

export function sectionDef(type: string): SectionDef | undefined {
  return SECTION_BY_TYPE.get(type);
}

export function blankSection(def: SectionDef): ResumeSection {
  return { id: newId(), type: def.type, title: def.title, entries: [] };
}

/** A new resume starts with every section present but empty. */
export function createBlankDoc(seed?: { fullName?: string; email?: string }): ResumeDoc {
  return {
    v: 1,
    header: {
      fullName: seed?.fullName ?? "",
      email: seed?.email ?? "",
      phone: "",
      gender: "",
      age: "",
      linkedin: "",
      crestPath: null,
    },
    sections: SECTION_DEFS.map(blankSection),
  };
}

/**
 * The read path for every stored resume.
 *
 * createBlankDoc() stamps the section list in at creation time, so without
 * this a resume built before a section existed would never gain it — which
 * would quietly break the registry's whole promise that adding a section is
 * one file and no migration. Backfilling on read means a doc written last
 * month picks up today's sections the next time it's opened.
 *
 * Sections are returned in registry order. That's a no-op today, since
 * createBlankDoc already writes them in that order — but if drag-to-reorder
 * ever ships, sections will need an explicit order field, because this sort
 * would otherwise undo the user's arrangement on the next load.
 */
export function hydrateResumeDoc(raw: unknown): ResumeDoc {
  const doc = normalizeResumeDoc(raw);
  const present = new Set(doc.sections.map((s) => s.type));
  const missing = SECTION_DEFS.filter((def) => !present.has(def.type)).map(blankSection);
  if (missing.length === 0) return doc;

  const order = new Map(SECTION_DEFS.map((def, i) => [def.type, i]));
  const sections = [...doc.sections, ...missing].sort(
    // Unknown types — a section from a future version — sort to the end
    // rather than being dropped.
    (a, b) => (order.get(a.type) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.type) ?? Number.MAX_SAFE_INTEGER)
  );
  return { ...doc, sections };
}

/**
 * Sections the user has actually filled in — what the preview and export
 * render. An empty section is skipped entirely rather than printing a bare
 * heading.
 */
export function filledSections(doc: ResumeDoc): ResumeSection[] {
  return doc.sections.filter((section) => section.entries.length > 0);
}
