import { ExternalLink } from "lucide-react";

function inferAction(title: string, note: string | null, format: string | null, url: string) {
  const text = `${title} ${note ?? ""} ${format ?? ""} ${url}`.toLowerCase();
  if (/youtube|youtu\.be|watch|video|podcast/.test(text)) return "Watch";
  if (/course|academy|cert|freecodecamp|deeplearning|coursera|khan academy/.test(text)) return "Course";
  if (/docs|documentation|guide|manual|spec|paper|article|blog|pdf|reference|overview|read/.test(text)) return "Read";
  if (/practice|playground|try|quickstart|exercise|lab|simulation|casebook/.test(text)) return "Practice";
  return "Open";
}

export function ResourceCard({
  icon,
  title,
  url,
  source,
  format,
  length,
  note,
}: {
  icon?: string | null;
  title: string;
  url: string;
  source?: string | null;
  format?: string | null;
  length?: string | null;
  note?: string | null;
}) {
  const action = inferAction(title, note ?? null, format ?? null, url);
  const metaParts = [source, format, length].filter(Boolean);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl border border-border bg-paper-2 p-4 transition-all duration-150 hover:border-accent/40 hover:bg-paper-3"
    >
      <div className="mt-0.5 text-xl leading-none">{icon || "🔗"}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-ink group-hover:underline">{title}</span>
          <ExternalLink size={14} className="mt-1 shrink-0 text-ink-3" />
        </div>
        {metaParts.length > 0 && <div className="mt-0.5 text-xs text-ink-3">{metaParts.join(" · ")}</div>}
        {note && <div className="mt-1 text-sm text-ink-2">{note}</div>}
      </div>
      <span className="mt-0.5 shrink-0 rounded-full bg-paper-3 px-2 py-1 text-[11px] font-semibold text-ink-2">
        {action}
      </span>
    </a>
  );
}
