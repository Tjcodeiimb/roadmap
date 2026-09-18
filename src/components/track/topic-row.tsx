"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, CheckCircle2, Circle, Zap } from "lucide-react";
import { listReveal } from "@/lib/motion";
import type { Status } from "@/lib/database.types";

const STATUS_CONFIG: Record<Status, {
  rowClass: string;
  rowStyle?: Record<string, string>;
  iconColor: string;
  textClass: string;
  label: string;
  Icon: typeof Circle;
}> = {
  done: {
    rowClass: "border-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]",
    rowStyle: { backgroundColor: "var(--success-soft)", borderColor: "var(--success)" },
    iconColor: "var(--success)",
    textClass: "text-ink",
    label: "Done",
    Icon: CheckCircle2,
  },
  active: {
    rowClass: "border-ink shadow-[3px_3px_0_0_var(--accent)]",
    rowStyle: { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)" },
    iconColor: "var(--accent)",
    textClass: "text-ink",
    label: "In progress",
    Icon: Zap,
  },
  next: {
    rowClass: "border-ink bg-paper-2 shadow-[3px_3px_0_0_var(--brutal-shadow)]",
    iconColor: "var(--ink-2)",
    textClass: "text-ink",
    label: "Up next",
    Icon: Circle,
  },
  todo: {
    rowClass: "border-dashed border-ink bg-paper opacity-75",
    iconColor: "var(--ink-3)",
    textClass: "text-ink-2",
    label: "To do",
    Icon: Circle,
  },
};

export function TopicRow({
  href,
  title,
  status,
  estimatedTime,
  index,
}: {
  href: string;
  title: string;
  status: Status;
  estimatedTime: string | null;
  index: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;

  return (
    <motion.div {...listReveal(index)}>
      <Link
        href={href}
        className={`press-sm group flex items-center gap-3 rounded-md border-2 px-4 py-3.5 transition-opacity ${cfg.rowClass}`}
        style={cfg.rowStyle}
      >
        <Icon size={18} className="shrink-0" style={{ color: cfg.iconColor }} />
        <div className="min-w-0 flex-1">
          <div className={`truncate font-bold ${cfg.textClass}`}>{title}</div>
          {estimatedTime && <div className="text-xs text-ink-3">{estimatedTime} estimated</div>}
        </div>
        <span
          className="shrink-0 rounded-sm border-2 border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ color: cfg.iconColor, borderColor: cfg.iconColor }}
        >
          {cfg.label}
        </span>
        <ChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
