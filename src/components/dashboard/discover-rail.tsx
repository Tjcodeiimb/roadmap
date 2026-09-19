import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { ArrowRight } from "lucide-react";
import { ICONS, FALLBACK_ICON, SparkMark } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";
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
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink">Continue &amp; discover</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {continueItems.map((s, i) => {
          const Icon = ICONS[s.track.id] ?? FALLBACK_ICON;
          return (
            <Reveal key={s.track.id} index={i}>
              <Link href={`/track/${s.track.id}/topic/${s.currentTopic!.id}`}>
                <Card className="press flex h-full items-center gap-3 p-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink"
                    style={{ backgroundColor: trackColor(s.track.id), color: trackInk(s.track.id) }}
                  >
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
                <Card className="press flex h-full items-center gap-3 p-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink"
                    style={{ backgroundColor: trackColor(skill.domain), color: trackInk(skill.domain) }}
                  >
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
