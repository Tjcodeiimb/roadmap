"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase: null, error: "Not authenticated" as const };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase: null, error: "Admins only" as const };

  return { supabase, error: null };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Phases
// ---------------------------------------------------------------------------

export async function createPhase(trackId: string, title: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const { data: existing } = await supabase
    .from("phases")
    .select("order_index")
    .eq("track_id", trackId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;
  const id = `${trackId}-${slugify(title)}-${Date.now().toString(36)}`;

  const { error: dbError } = await supabase
    .from("phases")
    .insert({ id, track_id: trackId, title, description: "", order_index: nextOrder });
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function updatePhase(
  id: string,
  trackId: string,
  fields: { title?: string; description?: string; estimated_weeks?: string | null }
) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("phases").update(fields).eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function deletePhase(id: string, trackId: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("phases").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function movePhase(id: string, trackId: string, direction: "up" | "down") {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const { data: phases } = await supabase
    .from("phases")
    .select("id, order_index")
    .eq("track_id", trackId)
    .order("order_index");
  if (!phases) return { error: "Not found" };
  const idx = phases.findIndex((p) => p.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapWith < 0 || swapWith >= phases.length) return { success: true };

  await supabase.from("phases").update({ order_index: phases[swapWith].order_index }).eq("id", phases[idx].id);
  await supabase.from("phases").update({ order_index: phases[idx].order_index }).eq("id", phases[swapWith].id);
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export async function createTopic(phaseId: string, trackId: string, title: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const { data: existing } = await supabase
    .from("topics")
    .select("order_index")
    .eq("phase_id", phaseId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;
  const id = `${phaseId}-${slugify(title)}-${Date.now().toString(36)}`;

  const { error: dbError } = await supabase
    .from("topics")
    .insert({ id, phase_id: phaseId, title, description: "", order_index: nextOrder });
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function updateTopic(
  id: string,
  trackId: string,
  fields: { title?: string; description?: string; estimated_time?: string | null; section?: string | null }
) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("topics").update(fields).eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function deleteTopic(id: string, trackId: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("topics").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function moveTopic(id: string, phaseId: string, trackId: string, direction: "up" | "down") {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const { data: topics } = await supabase
    .from("topics")
    .select("id, order_index")
    .eq("phase_id", phaseId)
    .order("order_index");
  if (!topics) return { error: "Not found" };
  const idx = topics.findIndex((t) => t.id === id);
  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapWith < 0 || swapWith >= topics.length) return { success: true };

  await supabase.from("topics").update({ order_index: topics[swapWith].order_index }).eq("id", topics[idx].id);
  await supabase.from("topics").update({ order_index: topics[idx].order_index }).eq("id", topics[swapWith].id);
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

export async function createResource(topicId: string, trackId: string, title: string, url: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const { data: existing } = await supabase
    .from("resources")
    .select("order_index")
    .eq("topic_id", topicId)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order_index ?? 0) + 1;
  const id = `${topicId}-r-${Date.now().toString(36)}`;

  const { error: dbError } = await supabase
    .from("resources")
    .insert({ id, topic_id: topicId, title, url, order_index: nextOrder });
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function updateResource(
  id: string,
  trackId: string,
  fields: {
    title?: string;
    url?: string;
    source?: string | null;
    format?: string | null;
    length?: string | null;
    note?: string | null;
  }
) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("resources").update(fields).eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

export async function deleteResource(id: string, trackId: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("resources").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath(`/admin/content/${trackId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export async function inviteEmployee(email: string, fullName: string) {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };

  const admin = createAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
  });
  if (inviteError) return { error: inviteError.message };
  revalidatePath("/admin");
  return { success: true };
}

export async function setUserRole(userId: string, role: "employee" | "admin") {
  const { supabase, error } = await requireAdmin();
  if (!supabase) return { error };
  const { error: dbError } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (dbError) return { error: dbError.message };
  revalidatePath("/admin");
  return { success: true };
}
