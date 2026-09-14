import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { ArrowRight } from "lucide-react";
import { ICONS, FALLBACK_ICON, SparkMark } from "@/components/icons";
import type { TrackProgressSummary, SkillProgress } from "@/lib/queries";

// Heuristic "Recommended next" — no ML needed at this scale. Reuses data
// the dashboard already fetches (getTrackSummaries' continue-pointer,
// getSkillProgress's done/total counts) rather than adding new queries.
export function DiscoverRail({
  summaries,
  almostUnlocked,
}: {
  summaries: TrackProgressSummary[];
  almostUnlocked: SkillProgress[];
}) {
  const continueItems = summaries.filter((s) => s.currentTopic).slice(0, 3);
  if (!continueItems.length && !almostUnlocked.length) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-3">Continue &amp; discover</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {continueItems.map((s, i) => {
          const Icon = ICONS[s.track.id] ?? FALLBACK_ICON;
          return (
            <Reveal key={s.track.id} index={i}>
              <Link href={`/track/${s.track.id}/topic/${s.currentTopic!.id}`}>
                <Card className="flex h-full items-center gap-3 p-4 transition-transform duration-200 ease-out hover:-translate-y-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-ink-3">{s.track.label}</div>
                    <div className="truncate text-sm font-semibold text-ink">{s.currentTopic!.title}</div>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-ink-3" />
                </Card>
              </Link>
            </Reveal>
          );
        })}
        {almostUnlocked.map((skill, i) => {
          const Icon = ICONS[skill.iconKey ?? ""] ?? FALLBACK_ICON;
          const remaining = skill.totalCount - skill.doneCount;
          return (
            <Reveal key={skill.id} index={continueItems.length + i}>
              <Link href="/skills">
                <Card className="flex h-full items-center gap-3 p-4 transition-transform duration-200 ease-out hover:-translate-y-1">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper-3 text-ink-2">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-ink-3 flex items-center gap-1">
                      <SparkMark size={11} /> {remaining} resource{remaining === 1 ? "" : "s"} to unlock
                    </div>
                    <div className="truncate text-sm font-semibold text-ink">{skill.name}</div>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-ink-3" />
                </Card>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
