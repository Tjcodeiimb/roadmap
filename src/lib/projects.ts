/**
 * The shapes behind project_playbooks' jsonb columns, plus the narrowing that
 * turns `unknown` from PostgREST into something renderable.
 *
 * These are reference lists, not relational data — nothing joins or filters on
 * them — so they live as jsonb and are parsed defensively here. A playbook
 * edited by hand in the admin panel can produce a half-written list, and a
 * malformed entry should drop out of the page rather than crash it.
 */

export interface PlaybookFormat {
  name: string;
  detail: string;
  length: string;
}

export interface PlaybookTool {
  name: string;
  use: string;
  url: string;
  free: boolean;
}

export interface PlaybookExport {
  name: string;
  detail: string;
  how: string;
}

/** A stage's checklist item. `d` is optional — some are a single instruction. */
export interface ChecklistItem {
  t: string;
  d?: string;
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function list(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function record(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function parseFormats(v: unknown): PlaybookFormat[] {
  return list(v)
    .map((raw) => {
      const o = record(raw);
      return { name: str(o.name), detail: str(o.detail), length: str(o.length) };
    })
    .filter((f) => f.name);
}

export function parseTools(v: unknown): PlaybookTool[] {
  return list(v)
    .map((raw) => {
      const o = record(raw);
      return { name: str(o.name), use: str(o.use), url: str(o.url), free: o.free === true };
    })
    .filter((t) => t.name);
}

export function parseExports(v: unknown): PlaybookExport[] {
  return list(v)
    .map((raw) => {
      const o = record(raw);
      return { name: str(o.name), detail: str(o.detail), how: str(o.how) };
    })
    .filter((e) => e.name);
}

/** dos and donts are plain string arrays. */
export function parseLines(v: unknown): string[] {
  return list(v).map(str).filter(Boolean);
}

export function parseChecklist(v: unknown): ChecklistItem[] {
  return list(v)
    .map((raw) => {
      const o = record(raw);
      return { t: str(o.t), d: str(o.d) || undefined };
    })
    .filter((c) => c.t);
}

/**
 * A learner's project, rendered as a resume PROJECTS entry.
 *
 * The playbook's `cv_line` is a template with <angle-bracket> placeholders —
 * it is guidance for the learner, not something to paste verbatim, so the
 * bullets are built from what they actually recorded and the template is only
 * shown to them as a hint elsewhere.
 */
export function projectToResumeEntry(project: {
  title: string;
  summary: string;
  outcome: string;
  link: string;
  playbookLabel: string;
}): { fields: Record<string, string>; bullets: string[] } {
  const bullets = [project.summary, project.outcome, project.link]
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    fields: { name: project.title, kind: project.playbookLabel },
    bullets,
  };
}

export const STAGE_STATUS_LABEL: Record<string, string> = {
  todo: "Not started",
  doing: "In progress",
  done: "Done",
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  done: "Finished",
  shelved: "Shelved",
};
