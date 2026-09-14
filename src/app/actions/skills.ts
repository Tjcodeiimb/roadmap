"use server";

import { createClient } from "@/lib/supabase/server";

// Stamps seen_at on the given user_skills rows so the unlock celebration
// never replays. SECURITY DEFINER on the RPC side — user_skills is
// select-only for the client, matching user_xp/user_streak.
export async function ackSkills(skillIds: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("ack_skills", { p_skill_ids: skillIds });
  if (error) return { error: error.message };
  return { success: true };
}
