import { ExternalMark, CheckMark } from "@/components/icons";
import type { PlaybookExport, PlaybookFormat, PlaybookTool } from "@/lib/projects";

/**
 * The read-only half of a playbook: what the deliverable has to look like,
 * what to do and not do, what to build it with, and how to get it out.
 *
 * Server components — none of this is interactive, so none of it needs to
 * ship as client JavaScript.
 */

export function SectionHeading({ title, help }: { title: string; help?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">{title}</h2>
      {help && <p className="mt-0.5 text-sm text-ink-2">{help}</p>}
    </div>
  );
}

export function FormatTable({ formats }: { formats: PlaybookFormat[] }) {
  return (
    <div className="overflow-hidden rounded-md border-2 border-ink shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      {formats.map((f, i) => (
        <div
          key={f.name}
          className={`flex flex-col gap-1 bg-paper-2 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4 ${
            i > 0 ? "border-t-2 border-ink" : ""
          }`}
        >
          <div className="w-full shrink-0 font-display text-sm font-bold text-ink sm:w-44">{f.name}</div>
          <p className="flex-1 text-sm text-ink-2">{f.detail}</p>
          {f.length && (
            <span className="shrink-0 rounded-sm border-2 border-ink bg-paper-3 px-2 py-0.5 font-mono text-[11px] font-bold text-ink-2">
              {f.length}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function DosAndDonts({ dos, donts }: { dos: string[]; donts: string[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-md border-2 border-ink bg-paper-2 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
        <div className="border-b-2 border-ink bg-success px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide text-white">
          Do
        </div>
        <ul className="flex flex-col">
          {dos.map((line, i) => (
            <li key={i} className={`flex gap-2.5 px-4 py-3 text-sm text-ink ${i > 0 ? "border-t-2 border-ink/10" : ""}`}>
              <CheckMark size={15} className="mt-0.5 shrink-0 text-success" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border-2 border-ink bg-paper-2 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
        <div className="border-b-2 border-ink bg-danger px-4 py-2 font-display text-sm font-extrabold uppercase tracking-wide text-white">
          Don&apos;t
        </div>
        <ul className="flex flex-col">
          {donts.map((line, i) => (
            <li key={i} className={`flex gap-2.5 px-4 py-3 text-sm text-ink ${i > 0 ? "border-t-2 border-ink/10" : ""}`}>
              <span aria-hidden className="mt-0.5 shrink-0 font-display font-extrabold text-danger">
                ×
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ToolGrid({ tools }: { tools: PlaybookTool[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tools.map((t) => (
        <a
          key={t.name}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="press-sm group flex flex-col gap-1 rounded-md border-2 border-ink bg-paper-2 px-4 py-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold text-ink group-hover:underline">{t.name}</span>
            {t.free && (
              <span className="rounded-sm border-2 border-ink bg-success px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-white">
                Free
              </span>
            )}
            <ExternalMark size={13} className="ml-auto shrink-0 text-ink-3" />
          </div>
          <p className="text-sm text-ink-2">{t.use}</p>
        </a>
      ))}
    </div>
  );
}

export function ExportList({ exports }: { exports: PlaybookExport[] }) {
  return (
    <div className="flex flex-col gap-3">
      {exports.map((e) => (
        <div
          key={e.name}
          className="rounded-md border-2 border-ink bg-paper-2 px-4 py-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
        >
          <div className="font-display text-sm font-bold text-ink">{e.name}</div>
          <p className="mt-0.5 text-sm text-ink-2">{e.detail}</p>
          {e.how && (
            <p className="mt-2 border-l-4 border-accent pl-3 font-mono text-xs leading-relaxed text-ink-2">{e.how}</p>
          )}
        </div>
      ))}
    </div>
  );
}
