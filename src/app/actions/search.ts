"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResult {
  type: "track" | "topic" | "resource" | "skill" | "cohort";
  id: string;
  parentTrackId: string | null;
  title: string;
  snippet: string | null;
}

export async function searchCatalog(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_catalog", { p_query: q });
  if (error) return [];

  return (data ?? []).map((r) => ({
    type: r.type,
    id: r.id,
    parentTrackId: r.parent_track_id,
    title: r.title,
    snippet: r.snippet,
  }));
}
