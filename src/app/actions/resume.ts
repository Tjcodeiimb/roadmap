"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createBlankDoc } from "@/lib/resume/sections";
import { normalizeResumeDoc, type ResumeDoc } from "@/lib/resume/types";

// Generous enough that nobody tailoring a resume per employer hits it,
// low enough that a runaway client can't fill the table.
const MAX_RESUMES = 20;

const MAX_TITLE = 80;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createResume(title?: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const [{ count }, { data: profile }] = await Promise.all([
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);
  if ((count ?? 0) >= MAX_RESUMES) {
    return { error: `You can keep up to ${MAX_RESUMES} resumes. Delete one to make room.` };
  }

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: (title ?? "My Resume").slice(0, MAX_TITLE),
      // Pre-fill only what we already hold. Everything else — phone, age,
      // gender — is asked for, never inferred.
      doc: createBlankDoc({ fullName: profile?.full_name ?? "", email: user.email ?? "" }),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/resume");
  return { success: true as const, id: data.id };
}

export async function saveResumeDoc(id: string, doc: ResumeDoc) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  // Normalizing before write keeps anything malformed from a stale client out
  // of the column, so every read can trust the shape.
  const { error } = await supabase
    .from("resumes")
    .update({ doc: normalizeResumeDoc(doc), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  // Without this the resume list kept a stale updated-at and entry count until
  // some other action happened to bust the cache.
  revalidatePath("/resume");
  return { success: true as const };
}

export async function renameResume(id: string, title: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = title.trim().slice(0, MAX_TITLE);
  if (!trimmed) return { error: "Give the resume a name." };

  const { error } = await supabase
    .from("resumes")
    .update({ title: trimmed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/resume");
  revalidatePath(`/resume/${id}`);
  return { success: true as const };
}

/**
 * The whole point of storing the document as one jsonb column: tailoring a
 * copy for a different employer is a read and an insert, not a deep copy
 * across several tables with id remapping.
 */
export async function duplicateResume(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_RESUMES) {
    return { error: `You can keep up to ${MAX_RESUMES} resumes. Delete one to make room.` };
  }

  // Scoped to the owner explicitly. RLS is not enough: migration 0030 lets an
  // admin READ any learner's resume, so without this filter an admin could
  // duplicate someone else's document — phone number, dates, work history —
  // into their own account.
  const { data: source } = await supabase
    .from("resumes")
    .select("title, doc")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!source) return { error: "Resume not found" };

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title: `${source.title} (copy)`.slice(0, MAX_TITLE),
      doc: source.doc,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/resume");
  return { success: true as const, id: data.id };
}

export async function deleteResume(id: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not authenticated" };

  // One row, no children: deletion is complete, with nothing orphaned behind.
  const { error } = await supabase.from("resumes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/resume");
  return { success: true as const };
}
