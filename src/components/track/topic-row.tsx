"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, CheckCircle2, Circle, Zap } from "lucide-react";
import { listReveal } from "@/lib/motion";
import type { Status } from "@/lib/database.types";

export function TopicRow({
  href,
  title,
  status,
  estimatedTime,
  index,
  activeColor = "var(--accent)",
  activeInk = "var(--accent-ink)",
}: {
  href: string;
  title: string;
  status: Status;
  estimatedTime: string | null;
  index: number;
  activeColor?: string;
  activeInk?: string;
}) {
  const rowStyle: React.CSSProperties = (() => {
    switch (status) {
      case "done":
        return {
          backgroundColor: "var(--success)",
          borderColor: "var(--success)",
          color: "var(--success-ink)",
        };
      case "active":
        return {
          backgroundColor: activeColor,
          borderColor: activeColor,
          color: activeInk,
        };
      case "next":
        return {
          backgroundColor: "var(--warning)",
          borderColor: "var(--warning)",
          color: "var(--warning-ink)",
        };
      case "todo":
        return {
          backgroundColor: "var(--paper-2)",
          borderColor: "var(--ink)",
          opacity: 0.6,
        };
    }
  })();

  const Icon = status === "done" ? CheckCircle2 : status === "active" ? Zap : Circle;

  const label =
    status === "done" ? "Done" :
    status === "active" ? "In Progress" :
    status === "next" ? "Up Next" :
    "To Do";

  return (
    <motion.div {...listReveal(index)}>
      <Link
        href={href}
        className="press-sm group flex items-center gap-3 rounded-md border-2 px-4 py-3.5 shadow-[3px_3px_0_0_var(--brutal-shadow)] transition-opacity"
        style={rowStyle}
      >
        <Icon size={18} className="shrink-0 opacity-90" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{title}</div>
          {estimatedTime && (
            <div className="text-xs opacity-75">{estimatedTime} estimated</div>
          )}
        </div>
        <span className="shrink-0 rounded-sm border-2 border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide opacity-90">
          {label}
        </span>
        <ChevronRight size={16} className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
