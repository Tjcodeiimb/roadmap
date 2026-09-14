import { createClient } from "@/lib/supabase/server";
import {
  getProfile,
  getUserXP,
  getUserStreak,
  getBuildProjects,
  getCompletedTopicsByTrack,
} from "@/lib/queries";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressRing } from "@/components/ui/progress-ring";
import { BuildProjectsPanel } from "@/components/profile/build-projects-panel";
import { LeaderboardOptIn } from "@/components/profile/leaderboard-optin";
import { SetPasswordForm } from "@/components/profile/set-password-form";
import { levelForXP } from "@/lib/gamification/levels";
import { LEVEL_ICONS, StreakMark, TrophyMark } from "@/components/icons";

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

  const [profile, xp, streak, projects, completedByTrack] = await Promise.all([
    getProfile(supabase, user.id),
    getUserXP(supabase),
    getUserStreak(supabase),
    getBuildProjects(supabase),
    getCompletedTopicsByTrack(supabase),
  ]);

  const level = levelForXP(xp.total_xp);
  const LevelIcon = LEVEL_ICONS[level.level - 1];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          {profile?.full_name ?? user.email}
        </h1>
        <p className="mt-1 text-ink-2">{user.email}</p>
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
        <div className="mb-3 text-sm font-semibold text-ink">Progress by track</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {completedByTrack.map(({ track, doneTopics }) => (
            <Card key={track.id} className="flex flex-col items-center gap-2 py-5 text-center">
              <ProgressRing progress={Math.min(100, doneTopics.length * 4)} size={44} strokeWidth={4}>
                <span className="text-[11px] font-bold text-ink">{doneTopics.length}</span>
              </ProgressRing>
              <div className="text-sm font-medium text-ink">{track.label}</div>
              <div className="text-xs text-ink-3">topics done</div>
            </Card>
          ))}
        </div>
      </div>

      <BuildProjectsPanel projects={projects} />

      <Card>
        <LeaderboardOptIn initial={profile?.leaderboard_opt_in ?? false} />
      </Card>

      {!params["set-password"] && (
        <details className="rounded-xl border border-border bg-paper-2 p-4">
          <summary className="cursor-pointer text-sm font-medium text-ink-2">Account settings</summary>
          <div className="mt-3">
            <SetPasswordForm />
          </div>
        </details>
      )}
    </div>
  );
}
