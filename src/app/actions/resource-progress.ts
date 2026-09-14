"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResourceProgressResult {
  success: boolean;
  error?: string;
  unlockedSkillIds: string[];
}

// Called on every progress flush from the player (every ~15s of accumulated
// watch time, plus pause/ended). Only a completing call revalidates —
// otherwise watching a video would bust the library/dashboard cache every
// few seconds for no visible benefit.
export async function updateResourceProgress(
  resourceId: string,
  position: number,
  watched: number,
  complete = false
): Promise<ResourceProgressResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_resource_progress", {
    p_resource_id: resourceId,
    p_position: position,
    p_watched: watched,
    p_complete: complete,
  });
  if (error) return { success: false, error: error.message, unlockedSkillIds: [] };
  if (complete) {
    revalidatePath("/library");
    revalidatePath(`/library/resource/${resourceId}`);
    revalidatePath("/dashboard");
  }
  return { success: true, unlockedSkillIds: data ?? [] };
}

// For non-embeddable resources: external link + explicit mark-complete.
export async function completeResource(resourceId: string): Promise<ResourceProgressResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_resource", { p_resource_id: resourceId });
  if (error) return { success: false, error: error.message, unlockedSkillIds: [] };
  revalidatePath("/library");
  revalidatePath(`/library/resource/${resourceId}`);
  revalidatePath("/dashboard");
  return { success: true, unlockedSkillIds: data ?? [] };
}
