import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSelectedTracks, getTrackSummaries, getReviewQueue } from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ArrowRight, RefreshCcw } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, trackIds] = await Promise.all([getProfile(supabase, user.id), getSelectedTracks(supabase)]);
  const [summaries, review] = await Promise.all([
    getTrackSummaries(supabase, trackIds),
    getReviewQueue(supabase),
  ]);

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
          <Card className="flex items-center gap-4 border-accent/30 bg-accent-soft transition-transform duration-200 hover:scale-[1.01]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-ink">
              <RefreshCcw size={18} />
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

      <div className="grid gap-4 sm:grid-cols-2">
        {summaries.map((s) => {
          const pct = s.totalTopics ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
          return (
            <Card key={s.track.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <ProgressRing progress={pct} size={52} strokeWidth={4}>
                  <span className="text-xs font-bold text-ink">{pct}%</span>
                </ProgressRing>
                <div>
                  <div className="font-display text-lg font-bold text-ink">{s.track.label}</div>
                  <div className="text-sm text-ink-2">
                    {s.doneTopics} of {s.totalTopics} topics done
                  </div>
                </div>
              </div>
              {s.currentTopic ? (
                <Link
                  href={`/track/${s.track.id}/topic/${s.currentTopic.id}`}
                  className="flex items-center justify-between rounded-xl bg-paper-3 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper-3/70"
                >
                  <span className="truncate">Continue: {s.currentTopic.title}</span>
                  <ArrowRight size={16} className="shrink-0" />
                </Link>
              ) : (
                <div className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                  All topics complete 🎉
                </div>
              )}
              <Link href={`/track/${s.track.id}`} className="text-sm text-ink-2 underline decoration-border underline-offset-4 hover:text-ink">
                View full roadmap
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
