import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ICONS, FALLBACK_ICON, CheckCircleMark } from "@/components/icons";
import type { ResourceBankStatus } from "@/lib/queries";

type Action = "Watch" | "Course" | "Read" | "Practice" | "Open";

function inferAction(title: string, note: string | null, format: string | null, url: string): Action {
  const text = `${title} ${note ?? ""} ${format ?? ""} ${url}`.toLowerCase();
  if (/youtube|youtu\.be|watch|video|podcast/.test(text)) return "Watch";
  if (/course|academy|cert|freecodecamp|deeplearning|coursera|khan academy/.test(text)) return "Course";
  if (/docs|documentation|guide|manual|spec|paper|article|blog|pdf|reference|overview|read/.test(text)) return "Read";
  if (/practice|playground|try|quickstart|exercise|lab|simulation|casebook/.test(text)) return "Practice";
  return "Open";
}

const ACTION_ICON_KEY: Record<Action, string> = {
  Watch: "video",
  Course: "course",
  Read: "article",
  Practice: "practice",
  Open: "web",
};

const STATUS_STYLE: Record<ResourceBankStatus, React.CSSProperties> = {
  done: {
    backgroundColor: "var(--success)",
    borderColor: "var(--success)",
    color: "var(--success-ink)",
  },
  in_progress: {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
    color: "var(--accent-ink)",
  },
  todo: {
    backgroundColor: "var(--paper-2)",
    borderColor: "var(--ink)",
  },
};

export function ResourceCard({
  id,
  iconKey,
  title,
  url,
  source,
  format,
  length,
  note,
  status = "todo",
}: {
  id: string;
  iconKey?: string | null;
  title: string;
  url: string;
  source?: string | null;
  format?: string | null;
  length?: string | null;
  note?: string | null;
  status?: ResourceBankStatus;
}) {
  const action = inferAction(title, note ?? null, format ?? null, url);
  const metaParts = [source, format, length].filter(Boolean);
  const Icon = ICONS[iconKey ?? ACTION_ICON_KEY[action]] ?? FALLBACK_ICON;
  const style = STATUS_STYLE[status];
  const isDone = status === "done";
  const isActive = status === "in_progress";

  return (
    <Link
      href={`/library/resource/${id}`}
      className="press-sm group flex items-start gap-3 rounded-md border-2 p-4 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
      style={style}
    >
      <Icon size={20} className="mt-0.5 shrink-0 opacity-80" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-bold group-hover:underline">{title}</span>
          {isDone ? (
            <CheckCircleMark size={16} className="mt-0.5 shrink-0" />
          ) : (
            <ChevronRight
              size={16}
              className="mt-0.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5"
            />
          )}
        </div>
        {metaParts.length > 0 && (
          <div className="mt-0.5 text-xs opacity-70">{metaParts.join(" · ")}</div>
        )}
        {note && <div className="mt-1 text-sm opacity-80">{note}</div>}
      </div>
      <span
        className="mt-0.5 shrink-0 rounded-sm border-2 border-current px-2 py-1 text-[11px] font-bold opacity-90"
        style={isActive || isDone ? { borderColor: "currentColor" } : { borderColor: "var(--ink)", color: "var(--ink-2)" }}
      >
        {action}
      </span>
    </Link>
  );
}
