"use client";

import { CountUp } from "@/components/ui/count-up";
import { progressToNextLevel } from "@/lib/gamification/levels";

export function XPWidget({ xp, streak }: { xp: number; streak: number }) {
  const { level, next, pct } = progressToNextLevel(xp);

  return (
    <div className="rounded-2xl border border-border bg-paper-2 p-4">
      <div className="flex items-center gap-3">
        <div className="text-2xl leading-none">{level.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              {level.label}
            </span>
            <span className="font-display text-lg font-bold text-ink">
              <CountUp value={xp} /> <span className="text-xs font-medium text-ink-3">XP</span>
            </span>
          </div>
          <div className="truncate text-xs text-ink-2">{level.name}</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-success transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-3">
        <span>{next ? `${next.min - xp} XP to next level` : "Max level"}</span>
        <span className="flex items-center gap-1">
          🔥 {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
