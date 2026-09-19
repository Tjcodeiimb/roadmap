"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ICONS, FALLBACK_ICON, LockMark, CheckCircleMark, SparkMark } from "@/components/icons";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { trackColor, trackInk } from "@/lib/track-colors";
import type { TrackSkillGroup } from "@/lib/queries";

export function SkillsView({ groups }: { groups: TrackSkillGroup[] }) {
  const [openTracks, setOpenTracks] = useState<Set<string>>(() => {
    // Start with the first track open
    return new Set(groups.length > 0 ? [groups[0].trackId] : []);
  });

  function toggle(trackId: string) {
    setOpenTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const isOpen = openTracks.has(group.trackId);
        const unlockedCount = group.skills.filter((s) => s.unlocked).length;
        const pct = group.skills.length > 0 ? Math.round((unlockedCount / group.skills.length) * 100) : 0;
        const color = trackColor(group.trackId);

        return (
          <div
            key={group.trackId}
            className="overflow-hidden rounded-md border-2 border-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            {/* Course header — always visible */}
            <button
              onClick={() => toggle(group.trackId)}
              className="flex w-full items-center gap-3 bg-paper-2 px-4 py-3 text-left hover:bg-paper-3 transition-colors"
              aria-expanded={isOpen}
            >
              {/* Color dot */}
              <span
                className="h-4 w-4 shrink-0 rounded-sm border-2 border-ink"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 font-display font-bold text-ink">{group.trackLabel}</span>
              {/* Progress pill */}
              <span className="shrink-0 rounded-sm border-2 border-ink bg-paper px-2 py-0.5 font-mono text-xs font-bold text-ink">
                {unlockedCount}/{group.skills.length}
              </span>
              {/* Progress bar inline */}
              <div className="hidden w-20 shrink-0 overflow-hidden rounded-sm border-2 border-ink bg-paper-3 sm:block">
                <div
                  className="h-2 transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
              {isOpen ? <ChevronUp size={16} className="shrink-0 text-ink-2" /> : <ChevronDown size={16} className="shrink-0 text-ink-2" />}
            </button>

            {/* Skill grid — collapsible */}
            {isOpen && (
              <div className="border-t-2 border-ink bg-paper p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.skills.map((skill) => {
                    const Icon = ICONS[skill.iconKey ?? ""] ?? FALLBACK_ICON;
                    const ink = trackInk(skill.domain);
                    return (
                      <div
                        key={skill.id}
                        className={
                          skill.unlocked
                            ? "flex items-start gap-3 rounded-md border-2 border-ink p-4 shadow-[2px_2px_0_0_var(--brutal-shadow)]"
                            : "flex items-start gap-3 rounded-md border-2 border-dashed border-ink bg-paper p-4 opacity-70"
                        }
                        style={skill.unlocked ? { backgroundColor: trackColor(skill.domain) } : undefined}
                      >
                        <div
                          className={
                            skill.unlocked
                              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-paper-2"
                              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-paper-3 text-ink-3"
                          }
                          style={skill.unlocked ? { color: trackColor(skill.domain) } : undefined}
                        >
                          {skill.unlocked ? <Icon size={20} /> : <LockMark size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={skill.unlocked ? { color: ink } : undefined}>
                              {skill.name}
                            </span>
                            <TierBadge tier={skill.tier} />
                          </div>
                          <p className="mt-0.5 text-xs" style={skill.unlocked ? { color: ink, opacity: 0.8 } : undefined}>
                            {skill.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            {skill.unlocked ? (
                              <span className="flex items-center gap-1 font-medium" style={{ color: ink }}>
                                <CheckCircleMark size={13} /> Unlocked
                              </span>
                            ) : (
                              <span className="text-ink-3">
                                {skill.doneCount} of {skill.totalCount} resources
                              </span>
                            )}
                            <span
                              className="flex items-center gap-1"
                              style={skill.unlocked ? { color: ink, opacity: 0.75 } : undefined}
                            >
                              <SparkMark size={12} /> {skill.xpReward} XP
                            </span>
                          </div>
                          {!skill.unlocked && skill.totalCount > 0 && (
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-sm border-2 border-ink bg-paper-3">
                              <div
                                className="h-full bg-accent"
                                style={{
                                  width: `${Math.min(100, Math.round((skill.doneCount / skill.totalCount) * 100))}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
