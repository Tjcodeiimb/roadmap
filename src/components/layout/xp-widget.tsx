"use client";

import { CountUp } from "@/components/ui/count-up";
import { progressToNextLevel } from "@/lib/gamification/levels";
import { LEVEL_ICONS, StreakMark } from "@/components/icons";

export function XPWidget({ xp, streak }: { xp: number; streak: number }) {
  const { level, next, pct } = progressToNextLevel(xp);
  const LevelIcon = LEVEL_ICONS[level.level - 1];

  return (
    <div className="overflow-hidden rounded-md border-2 border-ink bg-paper shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-accent px-3 py-2">
        <div className="flex items-center gap-2">
          <LevelIcon size={18} className="shrink-0 text-accent-ink" />
          <span className="font-display text-xs font-extrabold uppercase tracking-wide text-accent-ink">
            {level.label}
          </span>
        </div>
        <span className="font-display text-sm font-extrabold text-accent-ink">
          <CountUp value={xp} /><span className="ml-1 text-[10px] font-semibold opacity-75">XP</span>
        </span>
      </div>

      {/* Level name + progress */}
      <div className="px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-ink-2">{level.name}</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-ink">
              <StreakMark size={13} className="text-accent" />
              {streak}d streak
            </span>
          )}
        </div>

        <div className="relative h-2.5 overflow-hidden rounded-sm border-2 border-ink bg-paper-3">
          <div
            className="h-full bg-accent transition-[width] duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
          {/* Tick marks */}
          {[25, 50, 75].map((t) => (
            <div
              key={t}
              className="absolute top-0 h-full w-px bg-ink/20"
              style={{ left: `${t}%` }}
            />
          ))}
        </div>

        <div className="mt-1.5 text-[10px] font-medium text-ink-3">
          {next ? `${(next.min - xp).toLocaleString()} XP to ${next.label}` : "Max level reached"}
        </div>
      </div>
    </div>
  );
}
