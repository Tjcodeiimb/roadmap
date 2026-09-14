"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function enrollTrack(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_track", { p_track_id: trackId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function unenrollTrack(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unenroll_track", { p_track_id: trackId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath(`/track/${trackId}`);
  return { success: true };
}

export async function enrollCohort(cohortId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_cohort", { p_cohort_id: cohortId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function leaveCohort(cohortId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_cohort", { p_cohort_id: cohortId });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  return { success: true };
}
