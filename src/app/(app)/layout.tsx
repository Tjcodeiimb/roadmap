import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  getProfile,
  getSelectedTracks,
  getAllTracks,
  getUserXP,
  getPendingSkillUnlocks,
} from "@/lib/queries";
import { touchStreak } from "@/app/actions/progress";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, selectedTrackIds, allTracks] = await Promise.all([
    getProfile(supabase, user.id),
    getSelectedTracks(supabase),
    getAllTracks(supabase),
  ]);

  if (!profile?.onboarded) redirect("/onboarding");

  // touch_streak's own RPC already returns the up-to-date streak row, so
  // running it inside this Promise.all (instead of awaiting it separately,
  // then re-reading user_streak) turns 2 sequential round-trips into 1.
  const [streakResult, xp, pendingSkillUnlocks] = await Promise.all([
    touchStreak(),
    getUserXP(supabase),
    getPendingSkillUnlocks(supabase),
  ]);
  const streak = streakResult.data ?? { current_streak: 0, longest_streak: 0 };

  const tracks = allTracks
    .filter((t) => selectedTrackIds.includes(t.id))
    .map((t) => ({ id: t.id, label: t.label }));

  return (
    <AppShell
      tracks={tracks}
      isAdmin={profile?.role === "admin"}
      leaderboardEnabled={true}
      xp={xp.total_xp}
      streak={streak.current_streak}
      theme={(profile?.theme as "light" | "dark") ?? "light"}
      fullName={profile?.full_name ?? user.email ?? null}
      username={profile?.username ?? null}
      pendingSkillUnlocks={pendingSkillUnlocks}
    >
      {children}
    </AppShell>
  );
}
