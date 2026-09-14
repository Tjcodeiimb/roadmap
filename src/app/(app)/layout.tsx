import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  getProfile,
  getSelectedTracks,
  getAllTracks,
  getUserXP,
  getUserStreak,
  getReviewQueue,
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

  if (!selectedTrackIds.length) redirect("/onboarding");

  await touchStreak();

  const [xp, streak, review, pendingSkillUnlocks] = await Promise.all([
    getUserXP(supabase),
    getUserStreak(supabase),
    getReviewQueue(supabase),
    getPendingSkillUnlocks(supabase),
  ]);

  const tracks = allTracks
    .filter((t) => selectedTrackIds.includes(t.id))
    .map((t) => ({ id: t.id, label: t.label }));

  return (
    <AppShell
      tracks={tracks}
      reviewCount={review.due.length}
      isAdmin={profile?.role === "admin"}
      leaderboardEnabled={true}
      xp={xp.total_xp}
      streak={streak.current_streak}
      theme={(profile?.theme as "light" | "dark") ?? "light"}
      fullName={profile?.full_name ?? user.email ?? null}
      pendingSkillUnlocks={pendingSkillUnlocks}
    >
      {children}
    </AppShell>
  );
}
