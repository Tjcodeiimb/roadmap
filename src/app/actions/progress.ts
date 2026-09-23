"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Status } from "@/lib/database.types";

export async function setTopicStatus(topicId: string, status: Status, path?: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_topic_status", {
    p_topic_id: topicId,
    p_status: status,
  });
  if (error) return { error: error.message };
  if (path) revalidatePath(path);
  revalidatePath("/dashboard");
  revalidatePath("/review");
  return { success: true };
}

export async function reviewTopic(topicId: string, quality: 0 | 1 | 2) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_topic", {
    p_topic_id: topicId,
    p_quality: quality,
  });
  if (error) return { error: error.message };
  revalidatePath("/review");
  revalidatePath("/dashboard");
  // The RPC returns the card's real next review date; the old fixed labels
  // ("Rescheduled for tomorrow") were wrong for every stage past the first.
  return { success: true, nextReviewDate: data as string | null };
}

// Called once per session load (dashboard mount) — mirrors the original
// tool's getStreak(), which is idempotent within the same calendar day.
export async function touchStreak() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("touch_streak");
  if (error) return { error: error.message };
  return { data: data?.[0] ?? { current_streak: 0, longest_streak: 0 } };
}

// Called from the track and topic pages, before reading their data, so a
// duplicate credit granted just now is already reflected in what renders.
// No revalidatePath: this runs inline during the same request that renders
// the page, not from a separate mutation the cache needs telling about.
export async function creditDuplicateResources(trackId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("credit_duplicate_resources", { p_track_id: trackId });
  if (error) return { error: error.message };
  return { success: true };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function upsertBuildProject(input: {
  id?: string;
  title: string;
  status: "idea" | "in_progress" | "done";
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("build_projects").upsert(
    {
      id: input.id,
      user_id: user.id,
      title: input.title,
      status: input.status,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteBuildProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("build_projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}
