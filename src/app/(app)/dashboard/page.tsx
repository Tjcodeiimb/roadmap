import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSelectedTracks, getTrackSummaries, getReviewQueue, getSkillProgress } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DiscoverRail } from "@/components/dashboard/discover-rail";
import { ArrowRight } from "lucide-react";
import { BurstMark, RepeatMark, CompassMark } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, trackIds] = await Promise.all([getProfile(supabase, user.id), getSelectedTracks(supabase)]);
  const [summaries, review, skills] = await Promise.all([
    getTrackSummaries(supabase, trackIds),
    getReviewQueue(supabase),
    getSkillProgress(supabase),
  ]);

  // "Almost unlocked": within 2 resources of a skill's threshold, closest
  // first — a heuristic, not ML, reusing counts getSkillProgress already
  // computes for the Skills page.
  const almostUnlocked = skills
    .filter((s) => !s.unlocked && s.totalCount > 0 && s.totalCount - s.doneCount <= 2)
    .sort((a, b) => a.totalCount - a.doneCount - (b.totalCount - b.doneCount))
    .slice(0, 3);

  const firstName = (profile?.full_name ?? user.email ?? "there").split(" ")[0];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-base text-ink-2">Here&apos;s where you left off.</p>
      </div>

      {review.due.length > 0 && (
        <Link href="/review">
          <Card className="press flex items-center gap-4 bg-accent-soft">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-accent text-accent-ink">
              <RepeatMark size={18} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-ink">
                {review.due.length} review{review.due.length === 1 ? "" : "s"} today
              </div>
              <div className="text-sm text-ink-2">A quick spaced-repetition check-in — a couple of minutes.</div>
            </div>
            <ArrowRight size={18} className="text-ink-2" />
          </Card>
        </Link>
      )}

      <DiscoverRail summaries={summaries} almostUnlocked={almostUnlocked} />

      {summaries.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-accent-soft text-accent">
            <CompassMark size={22} />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-ink">No courses yet</div>
            <p className="mt-1 max-w-sm text-sm text-ink-2">
              Browse the marketplace to enroll in a course, or a curated cohort bundle that strings a few together.
            </p>
          </div>
          <Link href="/marketplace">
            <Button size="lg">
              Browse the marketplace <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {summaries.map((s, i) => {
            const pct = s.totalTopics ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
            return (
              <Reveal key={s.track.id} index={i}>
                <Card className="press flex h-full flex-col gap-4" style={{ backgroundColor: trackColor(s.track.id) }}>
                  <div className="flex items-center gap-4">
                    <ProgressRing
                      progress={pct}
                      size={52}
                      strokeWidth={4}
                      color={trackInk(s.track.id)}
                      trackColor={`color-mix(in srgb, ${trackInk(s.track.id)} 25%, transparent)`}
                    >
                      <span className="text-xs font-bold" style={{ color: trackInk(s.track.id) }}>{pct}%</span>
                    </ProgressRing>
                    <div>
                      <div className="font-display text-lg font-bold" style={{ color: trackInk(s.track.id) }}>{s.track.label}</div>
                      <div className="text-sm" style={{ color: trackInk(s.track.id), opacity: 0.8 }}>
                        {s.doneTopics} of {s.totalTopics} topics done
                      </div>
                    </div>
                  </div>
                  {s.currentTopic ? (
                    <Link
                      href={`/track/${s.track.id}/topic/${s.currentTopic.id}`}
                      className="press-sm flex items-center justify-between rounded-md border-2 border-ink bg-paper-2 px-4 py-3 text-sm font-bold text-ink"
                    >
                      <span className="truncate">Continue: {s.currentTopic.title}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border-2 border-success bg-success-soft px-4 py-3 text-sm font-bold text-success">
                      <BurstMark size={16} /> All topics complete
                    </div>
                  )}
                  <Link
                    href={`/track/${s.track.id}`}
                    className="text-sm font-bold underline decoration-2 underline-offset-4"
                    style={{ color: trackInk(s.track.id), opacity: 0.8 }}
                  >
                    View full roadmap
                  </Link>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
