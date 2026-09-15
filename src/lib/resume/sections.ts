import { newId, type ResumeDoc, type ResumeSection } from "./types";

// The section registry. Three consumers read this one file — the survey (to
// generate its questions), the on-screen preview, and the .docx exporter — so
// adding a section type is a change here and nowhere else, with no migration.
//
// The shapes come from the standard Indian B-school (IIM) CV: every section
// except Academic Qualifications is the same "left label block / right
// bullets" two-column entry, which is why one generic entry model covers
// seven of the eight sections.

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
  /** The format keeps entries to ~4 one-line bullets. */
  maxBullets: number;
  /** Optional sections get a Skip button in the survey. */
  optional: boolean;
  /** Label for the "add another" button, e.g. "internship". */
  entryNoun: string;
}

/**
 * The format's bullets are written to sit on exactly one printed line. Past
 * this the line wraps and the whole CV loses its grid, so the editor warns
 * rather than silently letting it happen.
 */
export const BULLET_SOFT_LIMIT = 135;

export const SECTION_DEFS: SectionDef[] = [
  {
    type: "education",
    title: "ACADEMIC QUALIFICATIONS",
    layout: "table",
    prompt: "Your degrees and schooling, most recent first.",
    fields: [
      { key: "degree", label: "Degree", placeholder: "BBA (DBE)", width: "half" },
      { key: "institute", label: "Institute / School", placeholder: "Indian Institute of Management, Bangalore" },
      { key: "grade", label: "CGPA / Grade", placeholder: "86.30/100", width: "half" },
      { key: "remarks", label: "Remarks", placeholder: "Commerce", width: "half" },
      { key: "year", label: "Year", placeholder: "2024-2027", width: "half" },
    ],
    hasBullets: false,
    maxBullets: 0,
    optional: false,
    entryNoun: "qualification",
  },
  {
    type: "academic_achievements",
    title: "ACADEMIC ACHIEVEMENTS",
    layout: "entries",
    prompt: "Group achievements under a short label — e.g. “Exam Scores & Scholarships”, “Global Exposure”.",
    fields: [{ key: "label", label: "Group label", placeholder: "Exam Scores & Scholarships" }],
    hasBullets: true,
    maxBullets: 4,
    optional: true,
    entryNoun: "group",
  },
  {
    type: "entrepreneurial",
    title: "ENTREPRENEURIAL EXPERIENCE",
    layout: "entries",
    prompt: "Ventures you founded or co-founded.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "UpForge Consulting" },
      { key: "role", label: "Role", placeholder: "Founder & CEO", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Dec’24 – Present", width: "half" },
    ],
    hasBullets: true,
    maxBullets: 4,
    optional: true,
    entryNoun: "venture",
  },
  {
    type: "internships",
    title: "INTERNSHIP EXPERIENCE",
    layout: "entries",
    prompt: "Internships and work stints, most recent first.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "What Customer Thinks Consulting" },
      { key: "role", label: "Role", placeholder: "Intern", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Sep’24 – Dec’24", width: "half" },
    ],
    hasBullets: true,
    maxBullets: 4,
    optional: true,
    entryNoun: "internship",
  },
  {
    type: "positions",
    title: "POSITIONS OF RESPONSIBILITY",
    layout: "entries",
    prompt: "Committee, club and society roles.",
    fields: [
      { key: "org", label: "Organisation", placeholder: "BMCC", width: "half" },
      { key: "body", label: "Body / Cell", placeholder: "Entrepreneurship Development Cell", width: "half" },
      { key: "role", label: "Role", placeholder: "Research Dept. Head", width: "half" },
      { key: "dates", label: "Duration", placeholder: "Dec’24 – Present", width: "half" },
    ],
    hasBullets: true,
    maxBullets: 4,
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
    maxBullets: 2,
    optional: true,
    entryNoun: "project",
  },
  {
    type: "awards",
    title: "ACHIEVEMENTS & AWARDS",
    layout: "entries",
    prompt: "Competitions, prizes and recognitions.",
    fields: [{ key: "title", label: "Award", placeholder: "B-Plan Comp: IIM Lucknow X CM Yuva" }],
    hasBullets: true,
    maxBullets: 3,
    optional: true,
    entryNoun: "award",
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
 * Sections the user has actually filled in — what the preview and export
 * render. An empty section is skipped entirely rather than printing a bare
 * heading.
 */
export function filledSections(doc: ResumeDoc): ResumeSection[] {
  return doc.sections.filter((section) => section.entries.length > 0);
}
