import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getUserXP,
  getUserStreak,
  getBuildProjects,
  getCompletedTopicsByTrack,
  getSelectedTracks,
  getTrackSummaries,
  getWatchStats,
  getSkillProgress,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BuildProjectsPanel } from "@/components/profile/build-projects-panel";
import { SetPasswordForm } from "@/components/profile/set-password-form";
import { UsernameForm } from "@/components/profile/username-form";
import { WatchStats } from "@/components/profile/watch-stats";
import { SkillsPanel } from "@/components/profile/skills-panel";
import { levelForXP } from "@/lib/gamification/levels";
import { LEVEL_ICONS, StreakMark, TrophyMark } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ "set-password"?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, xp, streak, projects, trackIds, watchStats, skills] = await Promise.all([
    getProfile(supabase, user.id),
    getUserXP(supabase),
    getUserStreak(supabase),
    getBuildProjects(supabase),
    getSelectedTracks(supabase),
    getWatchStats(supabase),
    getSkillProgress(supabase),
  ]);
  const [completedByTrack, trackSummaries] = await Promise.all([
    getCompletedTopicsByTrack(supabase, trackIds),
    getTrackSummaries(supabase, trackIds),
  ]);
  const topicsDone = completedByTrack.reduce((sum, t) => sum + t.doneTopics.length, 0);

  const level = levelForXP(xp.total_xp);
  const LevelIcon = LEVEL_ICONS[level.level - 1];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {profile?.full_name ?? user.email}
        </h1>
        {profile?.username && (
          <p className="mt-0.5 font-mono text-base text-ink-2">@{profile.username}</p>
        )}
        <p className="mt-1 text-sm text-ink-3">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col items-center gap-2 text-center">
          <LevelIcon size={30} className="text-accent" />
          <div className="font-display text-2xl font-bold text-ink">
            <CountUp value={xp.total_xp} />
          </div>
          <div className="text-xs uppercase tracking-wide text-ink-3">{level.name}</div>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <StreakMark size={30} className="text-accent" />
          <div className="font-display text-2xl font-bold text-ink">{streak.current_streak}</div>
          <div className="text-xs uppercase tracking-wide text-ink-3">Day streak</div>
        </Card>
        <Card className="flex flex-col items-center gap-2 text-center">
          <TrophyMark size={30} className="text-accent" />
          <div className="font-display text-2xl font-bold text-ink">{streak.longest_streak}</div>
          <div className="text-xs uppercase tracking-wide text-ink-3">Best streak</div>
        </Card>
      </div>

      {params["set-password"] && <SetPasswordForm />}

      <div>
        <div className="mb-3 text-sm font-bold text-ink">Progress by track</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {trackSummaries.map((s) => {
            const pct = s.totalTopics ? Math.round((s.doneTopics / s.totalTopics) * 100) : 0;
            return (
              <Link key={s.track.id} href={`/track/${s.track.id}`}>
                <Card className="press flex flex-col items-center gap-2 py-5 text-center" style={{ backgroundColor: trackColor(s.track.id) }}>
                  <ProgressRing
                    progress={pct}
                    size={44}
                    strokeWidth={4}
                    color={trackInk(s.track.id)}
                    trackColor={`color-mix(in srgb, ${trackInk(s.track.id)} 25%, transparent)`}
                  >
                    <span className="text-[11px] font-bold" style={{ color: trackInk(s.track.id) }}>{pct}%</span>
                  </ProgressRing>
                  <div className="text-sm font-bold" style={{ color: trackInk(s.track.id) }}>{s.track.label}</div>
                  <div className="text-xs" style={{ color: trackInk(s.track.id), opacity: 0.75 }}>
                    {s.doneTopics} of {s.totalTopics} topics
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <WatchStats
        secondsWatched={watchStats.secondsWatched}
        resourcesCompleted={watchStats.resourcesCompleted}
        videosCompleted={watchStats.videosCompleted}
        topicsDone={topicsDone}
      />

      <SkillsPanel skills={skills} />

      <BuildProjectsPanel projects={projects} />

      <Card>
        <div className="text-sm font-bold text-ink">Team leaderboard</div>
        <p className="mt-1 text-xs text-ink-3">
          Your name and XP appear on the team leaderboard, visible to everyone signed in. Nothing else is shared there —
          not your streak, your progress, or anything from your resumes.
        </p>
      </Card>

      {!params["set-password"] && (
        <details className="rounded-md border-2 border-ink bg-paper-2 p-4">
          <summary className="cursor-pointer text-sm font-bold text-ink-2">Account settings</summary>
          <div className="mt-4 flex flex-col gap-4">
            {profile?.username && (
              <div className="border-b-2 border-paper-3 pb-4">
                <UsernameForm current={profile.username} />
              </div>
            )}
            <SetPasswordForm />
          </div>
        </details>
      )}
    </div>
  );
}
