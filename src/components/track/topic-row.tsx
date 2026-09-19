"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, CheckCircle2, Circle, Zap } from "lucide-react";
import { listReveal, DUR, EASE } from "@/lib/motion";
import type { Status } from "@/lib/database.types";

export function TopicRow({
  href,
  title,
  status,
  estimatedTime,
  index,
  resourceDone = 0,
  resourceTotal = 0,
}: {
  href: string;
  title: string;
  status: Status;
  estimatedTime: string | null;
  index: number;
  resourceDone?: number;
  resourceTotal?: number;
}) {
  // Status colours are fixed app-wide rather than taken from the track hue:
  // a state has to mean the same thing on every course, and per-track
  // contrast varies too much to guarantee legible ink.
  const rowStyle: React.CSSProperties = (() => {
    switch (status) {
      case "done":
        return {
          backgroundColor: "var(--state-done)",
          borderColor: "var(--ink)",
          color: "var(--state-done-ink)",
        };
      case "active":
        return {
          backgroundColor: "var(--state-active)",
          borderColor: "var(--ink)",
          color: "var(--state-active-ink)",
        };
      case "next":
        return {
          backgroundColor: "var(--state-next)",
          borderColor: "var(--ink)",
          color: "var(--state-next-ink)",
        };
      case "todo":
        return {
          backgroundColor: "var(--state-todo)",
          borderColor: "var(--ink)",
          color: "var(--state-todo-ink)",
        };
    }
  })();

  const Icon =
    status === "done" ? CheckCircle2 : status === "active" ? Zap : status === "next" ? ArrowRight : Circle;

  const reduce = useReducedMotion();

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
          <div className="flex items-center gap-2 text-xs opacity-75">
            {resourceTotal > 0 && (
              <span className="font-bold tabular-nums">
                {resourceDone}/{resourceTotal} resources
              </span>
            )}
            {estimatedTime && <span>{estimatedTime} estimated</span>}
          </div>
          {resourceTotal > 0 && status !== "done" && (
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-current/20">
              <motion.div
                className="h-full bg-current"
                initial={false}
                animate={{ width: `${Math.round((resourceDone / resourceTotal) * 100)}%` }}
                transition={{ duration: reduce ? 0 : DUR.value, ease: EASE }}
              />
            </div>
          )}
        </div>
        <span className="hidden shrink-0 rounded-sm border-2 border-current px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide sm:inline-block">
          {label}
        </span>
        <ChevronRight size={16} className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
