import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Status } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export async function getProfile(supabase: Client, userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

export async function getSelectedTracks(supabase: Client) {
  const { data } = await supabase
    .from("user_track_selection")
    .select("track_id")
    .eq("status", "active");
  return (data ?? []).map((r) => r.track_id);
}

export interface EnrolledTrack {
  trackId: string;
  source: string;
  selectedAt: string;
}

export async function getEnrolledTracks(supabase: Client): Promise<EnrolledTrack[]> {
  const { data } = await supabase
    .from("user_track_selection")
    .select("track_id, source, selected_at")
    .eq("status", "active")
    .order("selected_at");
  return (data ?? []).map((r) => ({ trackId: r.track_id, source: r.source, selectedAt: r.selected_at }));
}

export async function getEnrolledCohortIds(supabase: Client): Promise<string[]> {
  const { data } = await supabase.from("user_cohort_enrollment").select("cohort_id");
  return (data ?? []).map((r) => r.cohort_id);
}

export async function getAllTracks(supabase: Client) {
  const { data } = await supabase.from("tracks").select("*").order("order_index");
  return data ?? [];
}

export interface TrackProgressSummary {
  track: { id: string; name: string; label: string };
  totalTopics: number;
  doneTopics: number;
  currentTopic: { id: string; title: string; phaseTitle: string } | null;
}

// Dashboard: one row per track the user has selected, with overall
// completion and a "continue where you left off" pointer.
export async function getTrackSummaries(supabase: Client, trackIds: string[]): Promise<TrackProgressSummary[]> {
  if (!trackIds.length) return [];

  const { data: tracks } = await supabase.from("tracks").select("*").in("id", trackIds).order("order_index");
  const { data: phases } = await supabase.from("phases").select("*").in("track_id", trackIds).order("order_index");
  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, phase_id, title, order_index")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"])
    .order("order_index");
  const { data: progress } = await supabase.from("user_progress").select("topic_id, status");

  const statusByTopic = new Map((progress ?? []).map((p) => [p.topic_id, p.status]));
  const phaseById = new Map((phases ?? []).map((p) => [p.id, p]));

  return (tracks ?? []).map((track) => {
    const trackTopics = (topics ?? []).filter((t) => phaseById.get(t.phase_id)?.track_id === track.id);
    const doneTopics = trackTopics.filter((t) => statusByTopic.get(t.id) === "done").length;
    const nextTopic =
      trackTopics.find((t) => statusByTopic.get(t.id) === "active") ??
      trackTopics.find((t) => statusByTopic.get(t.id) === "next") ??
      trackTopics.find((t) => (statusByTopic.get(t.id) ?? "todo") === "todo");

    return {
      track: { id: track.id, name: track.name, label: track.label },
      totalTopics: trackTopics.length,
      doneTopics,
      currentTopic: nextTopic
        ? {
            id: nextTopic.id,
            title: nextTopic.title,
            phaseTitle: phaseById.get(nextTopic.phase_id)?.title ?? "",
          }
        : null,
    };
  });
}

export async function getTrackDetail(supabase: Client, trackId: string) {
  const { data: track } = await supabase.from("tracks").select("*").eq("id", trackId).single();
  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .eq("track_id", trackId)
    .order("order_index");
  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"])
    .order("order_index");
  const { data: progress } = await supabase.from("user_progress").select("topic_id, status");
  const statusByTopic = new Map((progress ?? []).map((p) => [p.topic_id, p.status as Status]));

  const phasesWithTopics = (phases ?? []).map((phase) => ({
    ...phase,
    topics: (topics ?? [])
      .filter((t) => t.phase_id === phase.id)
      .map((t) => ({ ...t, status: statusByTopic.get(t.id) ?? ("todo" as Status) })),
  }));

  return { track, phases: phasesWithTopics };
}

// Full content tree for one track (no per-user status) — used by the admin
// content editor.
export async function getTrackContentTree(supabase: Client, trackId: string) {
  const { data: track } = await supabase.from("tracks").select("*").eq("id", trackId).single();
  const { data: phases } = await supabase.from("phases").select("*").eq("track_id", trackId).order("order_index");
  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"])
    .order("order_index");
  const topicIds = (topics ?? []).map((t) => t.id);
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .in("topic_id", topicIds.length ? topicIds : ["__none__"])
    .order("order_index");

  const phasesWithTopics = (phases ?? []).map((phase) => ({
    ...phase,
    topics: (topics ?? [])
      .filter((t) => t.phase_id === phase.id)
      .map((topic) => ({
        ...topic,
        resources: (resources ?? []).filter((r) => r.topic_id === topic.id),
      })),
  }));

  return { track, phases: phasesWithTopics };
}

export async function getTopicDetail(supabase: Client, topicId: string) {
  const { data: topic } = await supabase.from("topics").select("*").eq("id", topicId).single();
  if (!topic) return null;
  const { data: phase } = await supabase.from("phases").select("*").eq("id", topic.phase_id).single();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("topic_id", topicId)
    .order("order_index");
  const { data: progress } = await supabase
    .from("user_progress")
    .select("status")
    .eq("topic_id", topicId)
    .maybeSingle();

  return {
    topic,
    phase,
    resources: resources ?? [],
    status: (progress?.status as Status) ?? ("todo" as Status),
  };
}

export async function getUserXP(supabase: Client) {
  const { data } = await supabase.from("user_xp").select("*").maybeSingle();
  return data ?? { total_xp: 0, level: 1 };
}

export async function getUserStreak(supabase: Client) {
  const { data } = await supabase.from("user_streak").select("*").maybeSingle();
  return data ?? { current_streak: 0, longest_streak: 0, last_visit_date: null };
}

export interface ReviewItem {
  topicId: string;
  title: string;
  phaseTitle: string;
  section: string | null;
  estimatedTime: string | null;
  reps: number;
  nextReviewDate: string;
}

export async function getReviewQueue(supabase: Client) {
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: due }, { data: upcoming }] = await Promise.all([
    supabase
      .from("spaced_repetition")
      .select("topic_id, reps, next_review_date")
      .lte("next_review_date", today)
      .order("next_review_date"),
    supabase
      .from("spaced_repetition")
      .select("topic_id, reps, next_review_date")
      .gt("next_review_date", today)
      .order("next_review_date")
      .limit(6),
  ]);

  const topicIds = [...(due ?? []), ...(upcoming ?? [])].map((r) => r.topic_id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, title, section, estimated_time, phase_id")
    .in("id", topicIds.length ? topicIds : ["__none__"]);
  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));

  const phaseIds = (topics ?? []).map((t) => t.phase_id);
  const { data: phases } = await supabase
    .from("phases")
    .select("id, title")
    .in("id", phaseIds.length ? phaseIds : ["__none__"]);
  const phaseTitle = new Map((phases ?? []).map((p) => [p.id, p.title]));

  function toItem(row: { topic_id: string; reps: number; next_review_date: string }): ReviewItem | null {
    const topic = topicById.get(row.topic_id);
    if (!topic) return null;
    return {
      topicId: topic.id,
      title: topic.title,
      phaseTitle: phaseTitle.get(topic.phase_id) ?? "",
      section: topic.section,
      estimatedTime: topic.estimated_time,
      reps: row.reps,
      nextReviewDate: row.next_review_date,
    };
  }

  return {
    due: (due ?? []).map(toItem).filter((x): x is ReviewItem => !!x),
    upcoming: (upcoming ?? []).map(toItem).filter((x): x is ReviewItem => !!x),
  };
}

export async function getBuildProjects(supabase: Client) {
  const { data } = await supabase.from("build_projects").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

// Scoped to the caller's enrolled tracks — with the catalogue growing past
// 250+ topics, pulling every track/phase/topic regardless of enrollment
// would waste most of the query on tracks the user never joined.
export async function getCompletedTopicsByTrack(supabase: Client, trackIds: string[]) {
  if (!trackIds.length) return [];

  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, label")
    .in("id", trackIds)
    .order("order_index");
  const { data: phases } = await supabase.from("phases").select("id, track_id").in("track_id", trackIds);
  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, phase_id, title")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"]);
  const { data: progress } = await supabase
    .from("user_progress")
    .select("topic_id, status, completed_at")
    .eq("status", "done");

  const phaseTrack = new Map((phases ?? []).map((p) => [p.id, p.track_id]));
  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));

  return (tracks ?? []).map((track) => {
    const doneTopics = (progress ?? [])
      .filter((p) => {
        const topic = topicById.get(p.topic_id);
        return topic && phaseTrack.get(topic.phase_id) === track.id;
      })
      .map((p) => ({
        title: topicById.get(p.topic_id)?.title ?? "",
        completedAt: p.completed_at,
      }));
    return { track, doneTopics };
  });
}

export async function getLeaderboard(supabase: Client) {
  const { data, error } = await supabase.rpc("get_leaderboard");
  if (error) return [];
  return data ?? [];
}

export async function getAdminTrackStats(supabase: Client) {
  const { data, error } = await supabase.rpc("get_admin_track_stats");
  if (error) return [];
  return data ?? [];
}

export async function getAdminRoster(supabase: Client) {
  const { data, error } = await supabase.rpc("get_admin_roster");
  if (error) return [];
  return data ?? [];
}
