import clsx from "clsx";
import type { Status } from "@/lib/database.types";
import { STATUS_LABELS } from "@/lib/gamification/constants";

const STATUS_CLASSES: Record<Status, string> = {
  done: "bg-success-soft text-success",
  active: "bg-accent-soft text-accent",
  next: "bg-paper-3 text-ink-2",
  todo: "bg-paper-3 text-ink-3",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
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
        "inline-flex items-center rounded-full bg-paper-3 px-2.5 py-1 text-xs font-medium text-ink-2",
        className
      )}
    >
      {children}
    </span>
  );
}
