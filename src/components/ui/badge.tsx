import clsx from "clsx";
import type { Status } from "@/lib/database.types";
import { STATUS_LABELS } from "@/lib/gamification/constants";

// Flat blocks with a visible border instead of soft tinted pills — a tag
// reads as a small labeled box, not a rounded chip fading into the page.
const STATUS_CLASSES: Record<Status, string> = {
  done: "bg-success-soft text-success border-success",
  active: "bg-accent-soft text-accent border-accent",
  next: "bg-paper-3 text-ink-2 border-ink",
  todo: "bg-paper-3 text-ink-3 border-ink",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        STATUS_CLASSES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 text-xs font-bold text-ink-2",
        className
      )}
    >
      {children}
    </span>
  );
}
