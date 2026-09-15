// The shape stored in resumes.doc (jsonb). Kept deliberately small and
// array-ordered: section order and entry order are just array order, so
// reordering never needs an order_index rewrite.

export interface ResumeEntry {
  id: string;
  /** Keyed by SectionDef.fields[].key — e.g. { org: "UpForge", role: "Founder" }. */
  fields: Record<string, string>;
  bullets: string[];
}

export interface ResumeSection {
  id: string;
  /** Key into SECTION_DEFS. */
  type: string;
  /** Defaults from the registry, but renamable per resume. */
  title: string;
  entries: ResumeEntry[];
}

export interface ResumeHeader {
  fullName: string;
  email: string;
  phone: string;
  /** Conventional on Indian B-school CVs; optional, and never required. */
  gender: string;
  age: string;
  linkedin: string;
  /**
   * Reserved for a college crest. Photos are deliberately not supported.
   * If this is ever populated it must be a path into a private Storage
   * bucket, never a user-supplied URL — the exporter fetches it server-side,
   * so a user-supplied URL would be an SSRF vector.
   */
  crestPath: string | null;
}

export interface ResumeDoc {
  v: 1;
  header: ResumeHeader;
  sections: ResumeSection[];
}

export function newId(): string {
  return crypto.randomUUID();
}

const EMPTY_HEADER: ResumeHeader = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  age: "",
  linkedin: "",
  crestPath: null,
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Fills in anything missing so the renderer and exporter can assume a
 * complete shape. Also the upgrade seam: a doc written by an older version
 * lands here first.
 */
export function normalizeResumeDoc(raw: unknown): ResumeDoc {
  const doc = (raw ?? {}) as Partial<ResumeDoc>;
  const header = (doc.header ?? {}) as Partial<ResumeHeader>;

  return {
    v: 1,
    header: {
      ...EMPTY_HEADER,
      fullName: str(header.fullName),
      email: str(header.email),
      phone: str(header.phone),
      gender: str(header.gender),
      age: str(header.age),
      linkedin: str(header.linkedin),
      crestPath: typeof header.crestPath === "string" ? header.crestPath : null,
    },
    sections: (Array.isArray(doc.sections) ? doc.sections : []).map((section) => ({
      id: str(section?.id) || newId(),
      type: str(section?.type),
      title: str(section?.title),
      entries: (Array.isArray(section?.entries) ? section.entries : []).map((entry) => ({
        id: str(entry?.id) || newId(),
        fields:
          entry?.fields && typeof entry.fields === "object"
            ? Object.fromEntries(Object.entries(entry.fields).map(([k, v]) => [k, str(v)]))
            : {},
        bullets: (Array.isArray(entry?.bullets) ? entry.bullets : []).map(str).filter(Boolean),
      })),
    })),
  };
}

/** True once there's enough in the doc to render something meaningful. */
export function isDocStarted(doc: ResumeDoc): boolean {
  return Boolean(doc.header.fullName) || doc.sections.some((s) => s.entries.length > 0);
}
