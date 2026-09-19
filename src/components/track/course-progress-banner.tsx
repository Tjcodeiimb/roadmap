"use client";

import { CheckCircle2, Zap, Circle } from "lucide-react";

interface PhaseData {
  title: string;
  done: number;
  total: number;
}

export function CourseProgressBanner({
  color,
  pct,
  doneTopics,
  activeTopics,
  totalTopics,
  phases,
}: {
  color: string;
  pct: number;
  doneTopics: number;
  activeTopics: number;
  totalTopics: number;
  phases: PhaseData[];
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

      {/* Per-phase breakdown */}
      {phases.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wide text-ink-3">
                Ph.{i + 1}
              </span>
              <div className="flex-1 h-2 overflow-hidden rounded-sm border border-ink bg-paper-2">
                {phase.total > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${(phase.done / phase.total) * 100}%`,
                      backgroundColor:
                        phase.done === phase.total && phase.done > 0
                          ? "var(--success)"
                          : color,
                    }}
                  />
                )}
              </div>
              <span className="w-8 shrink-0 text-right text-[10px] font-bold text-ink-3">
                {phase.done}/{phase.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
