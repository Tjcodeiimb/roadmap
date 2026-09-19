"use client";

import { CheckCircle2, Zap, Circle } from "lucide-react";

export function CourseProgressBanner({
  color,
  pct,
  doneTopics,
  activeTopics,
  totalTopics,
}: {
  color: string;
  pct: number;
  doneTopics: number;
  activeTopics: number;
  totalTopics: number;
}) {
  const todoTopics = totalTopics - doneTopics - activeTopics;

  return (
    <div
      className="rounded-md border-2 border-ink bg-paper p-5"
      style={{ boxShadow: "4px 4px 0 0 var(--brutal-shadow)" }}
    >
      {/* Big pct + stat chips */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="shrink-0">
          <div className="font-mono text-5xl font-black leading-none" style={{ color }}>
            {pct}%
          </div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-ink-3">complete</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div
            className="flex items-center gap-1.5 rounded-sm border-2 px-3 py-1.5"
            style={{ borderColor: "var(--success)", backgroundColor: "var(--success-soft)" }}
          >
            <CheckCircle2 size={13} style={{ color: "var(--success)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--success)" }}>
              {doneTopics} done
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-sm border-2 px-3 py-1.5"
            style={{ borderColor: color }}
          >
            <Zap size={13} style={{ color }} />
            <span className="text-xs font-bold" style={{ color }}>
              {activeTopics} in progress
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-sm border-2 border-ink bg-paper-2 px-3 py-1.5">
            <Circle size={13} className="text-ink-3" />
            <span className="text-xs font-bold text-ink-3">{todoTopics} to do</span>
          </div>
        </div>
      </div>

      {/* Segmented progress bar */}
      <div className="mb-4 flex h-5 overflow-hidden rounded-sm border-2 border-ink bg-paper-2">
        {doneTopics > 0 && totalTopics > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${(doneTopics / totalTopics) * 100}%`, backgroundColor: "var(--success)" }}
          />
        )}
        {activeTopics > 0 && totalTopics > 0 && (
          <div
            className="h-full transition-all duration-700 opacity-70"
            style={{ width: `${(activeTopics / totalTopics) * 100}%`, backgroundColor: color }}
          />
        )}
      </div>

    </div>
  );
}
