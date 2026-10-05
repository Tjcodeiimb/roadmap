"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Pages whose content depends on what the learner is enrolled in. The
 * marketplace detail routes are listed explicitly because
 * revalidatePath("/marketplace") does not reach nested dynamic segments —
 * without them a course you just left still showed "Continue" on its own
 * marketplace page until a hard reload.
 */
function revalidateEnrollment({ trackId, cohortId }: { trackId?: string; cohortId?: string } = {}) {
  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath("/courses");
  if (trackId) {
    revalidatePath(`/track/${trackId}`);
    revalidatePath(`/marketplace/course/${trackId}`);
  }
  if (cohortId) revalidatePath(`/marketplace/cohort/${cohortId}`);
}

export async function enrollTrack(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_track", { p_track_id: trackId });
  if (error) return { error: error.message };
  revalidateEnrollment({ trackId });
  return { success: true };
}

export async function unenrollTrack(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unenroll_track", { p_track_id: trackId });
  if (error) return { error: error.message };
  revalidateEnrollment({ trackId });
  return { success: true };
}

/**
 * Leave several courses in one go (the sidebar's manage mode and the
 * My courses page). Loops the same unenroll_track RPC rather than a new bulk
 * one, so each course keeps the archive-don't-delete behaviour and the cohort
 * bookkeeping in migration 0027.
 */
export async function unenrollTracks(trackIds: string[]) {
  if (trackIds.length === 0) return { error: "Nothing selected" };
  const supabase = await createClient();

  const failed: string[] = [];
  for (const trackId of trackIds) {
    const { error } = await supabase.rpc("unenroll_track", { p_track_id: trackId });
    if (error) failed.push(trackId);
    else revalidateEnrollment({ trackId });
  }
  revalidateEnrollment();

  const left = trackIds.length - failed.length;
  if (failed.length > 0) return { error: `Left ${left}, but ${failed.length} failed`, left };
  return { success: true, left };
}

export async function enrollCohort(cohortId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_cohort", { p_cohort_id: cohortId });
  if (error) return { error: error.message };
  revalidateEnrollment({ cohortId });
  return { success: true };
}

export async function leaveCohort(cohortId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_cohort", { p_cohort_id: cohortId });
  if (error) return { error: error.message };
  revalidateEnrollment({ cohortId });
  return { success: true };
}
