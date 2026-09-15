"use client";

import { CountUp } from "@/components/ui/count-up";
import { progressToNextLevel } from "@/lib/gamification/levels";
import { LEVEL_ICONS, StreakMark } from "@/components/icons";

export function XPWidget({ xp, streak }: { xp: number; streak: number }) {
  const { level, next, pct } = progressToNextLevel(xp);
  const LevelIcon = LEVEL_ICONS[level.level - 1];

  return (
    <div className="rounded-md border-2 border-ink bg-paper-2 p-4 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <div className="flex items-center gap-3">
        <LevelIcon size={26} className="shrink-0 text-accent" />
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

      <div className="mt-3 h-2 overflow-hidden rounded-sm border-2 border-ink bg-paper-3">
        <div
          className="h-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-ink-3">
        <span>{next ? `${next.min - xp} XP to next level` : "Max level"}</span>
        <span className="flex items-center gap-1">
          <StreakMark size={12} /> {streak} day{streak === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
