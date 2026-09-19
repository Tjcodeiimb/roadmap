"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Zap } from "lucide-react";
import { DUR, EASE } from "@/lib/motion";
import type { Status } from "@/lib/database.types";

const STATE = {
  done: {
    label: "Completed",
    bg: "var(--state-done)",
    ink: "var(--state-done-ink)",
    Icon: CheckCircle2,
  },
  active: {
    label: "In progress",
    bg: "var(--state-active)",
    ink: "var(--state-active-ink)",
    Icon: Zap,
  },
  next: {
    label: "Up next",
    bg: "var(--state-next)",
    ink: "var(--state-next-ink)",
    Icon: ArrowRight,
  },
  todo: {
    label: "Not started",
    bg: "var(--state-todo)",
    ink: "var(--state-todo-ink)",
    Icon: Circle,
  },
} as const;

/**
 * Replaces the old four-button status picker. Status is derived from how many
 * of the topic's resources are finished, so there is nothing to press here —
 * this just reports where the learner stands.
 */
export function TopicProgressHeader({
  status,
  done,
  total,
}: {
  status: Status;
  done: number;
  total: number;
}) {
  const state = STATE[status] ?? STATE.todo;
  const { Icon } = state;
  const pct = total > 0 ? Math.round((done / total) * 100) : status === "done" ? 100 : 0;
  // MotionConfig reducedMotion="user" only drops transform/layout animations —
  // a width animation keeps running, so it has to be gated by hand.
  const reduce = useReducedMotion();

  return (
    <div
      className="rounded-md border-2 border-ink p-4 shadow-[4px_4px_0_0_var(--brutal-shadow)]"
      style={{ backgroundColor: state.bg, color: state.ink }}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className="shrink-0" />
        <span className="font-display text-base font-bold">{state.label}</span>
        {total > 0 && (
          <span className="ml-auto text-sm font-bold tabular-nums">
            {done} of {total} resources
          </span>
        )}
      </div>

      {total > 0 && (
        <div
          className="mt-3 h-2 overflow-hidden rounded-full border-2 border-current/30"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Topic progress"
        >
          <motion.div
            className="h-full bg-current"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: reduce ? 0 : DUR.value, ease: EASE }}
          />
        </div>
      )}
    </div>
  );
}
