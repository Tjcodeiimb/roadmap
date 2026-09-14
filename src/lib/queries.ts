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

// ---------------------------------------------------------------------------
// Marketplace
// ---------------------------------------------------------------------------

export interface MarketplaceCourse {
  id: string;
  label: string;
  summary: string;
  tier: string;
  domain: string | null;
  estimatedHours: number | null;
  effortPerWeek: string | null;
  iconKey: string | null;
  topicCount: number;
  resourceCount: number;
  skillNames: string[];
  enrolled: boolean;
}

// Every skill a track can grant: a skill counts if any of its mapped
// resources belongs to a topic under that track. Computed in JS because
// `Relationships: []` means embedded selects don't type — same idiom as
// getTrackSummaries.
async function getSkillNamesByTrack(supabase: Client): Promise<Map<string, string[]>> {
  const { data: skillResources } = await supabase.from("skill_resources").select("skill_id, resource_id");
  if (!skillResources?.length) return new Map();

  const resourceIds = [...new Set(skillResources.map((sr) => sr.resource_id))];
  const { data: resources } = await supabase
    .from("resources")
    .select("id, topic_id")
    .in("id", resourceIds);
  const topicIds = [...new Set((resources ?? []).map((r) => r.topic_id))];
  const { data: topics } = await supabase.from("topics").select("id, phase_id").in("id", topicIds);
  const phaseIds = [...new Set((topics ?? []).map((t) => t.phase_id))];
  const { data: phases } = await supabase.from("phases").select("id, track_id").in("id", phaseIds);
  const { data: skills } = await supabase.from("skills").select("id, name");

  const topicByResource = new Map((resources ?? []).map((r) => [r.id, r.topic_id]));
  const phaseByTopic = new Map((topics ?? []).map((t) => [t.id, t.phase_id]));
  const trackByPhase = new Map((phases ?? []).map((p) => [p.id, p.track_id]));
  const skillName = new Map((skills ?? []).map((s) => [s.id, s.name]));

  const trackSkillIds = new Map<string, Set<string>>();
  for (const sr of skillResources) {
    const topicId = topicByResource.get(sr.resource_id);
    const phaseId = topicId ? phaseByTopic.get(topicId) : undefined;
    const trackId = phaseId ? trackByPhase.get(phaseId) : undefined;
    if (!trackId) continue;
    if (!trackSkillIds.has(trackId)) trackSkillIds.set(trackId, new Set());
    trackSkillIds.get(trackId)!.add(sr.skill_id);
  }

  const result = new Map<string, string[]>();
  for (const [trackId, skillIds] of trackSkillIds) {
    result.set(
      trackId,
      [...skillIds].map((id) => skillName.get(id) ?? id)
    );
  }
  return result;
}

export async function getMarketplaceCourses(supabase: Client): Promise<MarketplaceCourse[]> {
  const [{ data: tracks }, { data: phases }, enrolledIds, skillsByTrack] = await Promise.all([
    supabase.from("tracks").select("*").eq("published", true).order("order_index"),
    supabase.from("phases").select("id, track_id"),
    getSelectedTracks(supabase),
    getSkillNamesByTrack(supabase),
  ]);

  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, phase_id")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"]);
  const topicIds = (topics ?? []).map((t) => t.id);
  const { data: resources } = await supabase
    .from("resources")
    .select("id, topic_id")
    .in("topic_id", topicIds.length ? topicIds : ["__none__"]);

  const phaseTrack = new Map((phases ?? []).map((p) => [p.id, p.track_id]));
  const topicsByTrack = new Map<string, number>();
  const topicTrack = new Map<string, string>();
  for (const t of topics ?? []) {
    const trackId = phaseTrack.get(t.phase_id);
    if (!trackId) continue;
    topicTrack.set(t.id, trackId);
    topicsByTrack.set(trackId, (topicsByTrack.get(trackId) ?? 0) + 1);
  }
  const resourcesByTrack = new Map<string, number>();
  for (const r of resources ?? []) {
    const trackId = topicTrack.get(r.topic_id);
    if (!trackId) continue;
    resourcesByTrack.set(trackId, (resourcesByTrack.get(trackId) ?? 0) + 1);
  }

  const enrolledSet = new Set(enrolledIds);

  return (tracks ?? []).map((t) => ({
    id: t.id,
    label: t.label,
    summary: t.summary,
    tier: t.tier,
    domain: t.domain,
    estimatedHours: t.estimated_hours,
    effortPerWeek: t.effort_per_week,
    iconKey: t.icon_key,
    topicCount: topicsByTrack.get(t.id) ?? 0,
    resourceCount: resourcesByTrack.get(t.id) ?? 0,
    skillNames: skillsByTrack.get(t.id) ?? [],
    enrolled: enrolledSet.has(t.id),
  }));
}

export interface MarketplaceCohort {
  id: string;
  label: string;
  summary: string;
  tier: string;
  iconKey: string | null;
  estimatedHours: number | null;
  courses: { id: string; label: string; iconKey: string | null }[];
  enrolled: boolean;
}

export async function getMarketplaceCohorts(supabase: Client): Promise<MarketplaceCohort[]> {
  const [{ data: cohorts }, { data: cohortCourses }, { data: tracks }, enrolledCohortIds] = await Promise.all([
    supabase.from("cohorts").select("*").eq("published", true).order("order_index"),
    supabase.from("cohort_courses").select("cohort_id, track_id, order_index").order("order_index"),
    supabase.from("tracks").select("id, label, icon_key"),
    getEnrolledCohortIds(supabase),
  ]);

  const trackById = new Map((tracks ?? []).map((t) => [t.id, t]));
  const enrolledSet = new Set(enrolledCohortIds);

  return (cohorts ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    summary: c.summary,
    tier: c.tier,
    iconKey: c.icon_key,
    estimatedHours: c.estimated_hours,
    courses: (cohortCourses ?? [])
      .filter((cc) => cc.cohort_id === c.id)
      .map((cc) => {
        const t = trackById.get(cc.track_id);
        return { id: cc.track_id, label: t?.label ?? cc.track_id, iconKey: t?.icon_key ?? null };
      }),
    enrolled: enrolledSet.has(c.id),
  }));
}

export async function getCourseDetail(supabase: Client, trackId: string) {
  const [{ data: track }, courses, skillsByTrack, enrolledIds] = await Promise.all([
    supabase.from("tracks").select("*").eq("id", trackId).single(),
    getMarketplaceCourses(supabase),
    getSkillNamesByTrack(supabase),
    getSelectedTracks(supabase),
  ]);
  if (!track) return null;

  const { data: phases } = await supabase
    .from("phases")
    .select("id, title, description, estimated_weeks")
    .eq("track_id", trackId)
    .order("order_index");
  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, phase_id, title")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"])
    .order("order_index");

  const summary = courses.find((c) => c.id === trackId);

  return {
    track,
    enrolled: enrolledIds.includes(trackId),
    topicCount: summary?.topicCount ?? 0,
    resourceCount: summary?.resourceCount ?? 0,
    skillNames: skillsByTrack.get(trackId) ?? [],
    phases: (phases ?? []).map((p) => ({
      ...p,
      topics: (topics ?? []).filter((t) => t.phase_id === p.id),
    })),
  };
}

export async function getCohortDetail(supabase: Client, cohortId: string) {
  const [{ data: cohort }, cohorts] = await Promise.all([
    supabase.from("cohorts").select("*").eq("id", cohortId).single(),
    getMarketplaceCohorts(supabase),
  ]);
  if (!cohort) return null;
  const summary = cohorts.find((c) => c.id === cohortId);
  return { cohort, courses: summary?.courses ?? [], enrolled: summary?.enrolled ?? false };
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

export type ResourceBankStatus = "todo" | "in_progress" | "done";

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
  const status = (progress?.status as Status) ?? ("todo" as Status);

  const resourceIds = (resources ?? []).map((r) => r.id);
  const { data: resourceProgress } = await supabase
    .from("user_resource_progress")
    .select("resource_id, status")
    .in("resource_id", resourceIds.length ? resourceIds : ["__none__"]);
  const resourceStatusById = new Map((resourceProgress ?? []).map((p) => [p.resource_id, p.status]));

  return {
    topic,
    phase,
    resources: (resources ?? []).map((r) => ({
      ...r,
      status: (resourceStatusById.get(r.id) === "done" || status === "done"
        ? "done"
        : resourceStatusById.get(r.id) === "in_progress"
          ? "in_progress"
          : "todo") as ResourceBankStatus,
    })),
    status,
  };
}

// ---------------------------------------------------------------------------
// Library — one browsable bank of every resource across enrolled tracks,
// plus per-resource progress for the embedded player.
// ---------------------------------------------------------------------------

export interface LibraryResource {
  id: string;
  title: string;
  url: string;
  source: string | null;
  format: string | null;
  length: string | null;
  note: string | null;
  iconKey: string | null;
  provider: string | null;
  embeddable: boolean;
  durationSeconds: number | null;
  topicId: string;
  topicTitle: string;
  trackId: string;
  trackLabel: string;
  trackIconKey: string | null;
  status: ResourceBankStatus;
  secondsWatched: number;
  lastPositionSeconds: number;
  updatedAt: string | null;
}

export async function getLibraryResources(supabase: Client, trackIds: string[]): Promise<LibraryResource[]> {
  if (!trackIds.length) return [];

  const [{ data: tracks }, { data: phases }] = await Promise.all([
    supabase.from("tracks").select("id, label, icon_key").in("id", trackIds).order("order_index"),
    supabase.from("phases").select("id, track_id").in("track_id", trackIds).order("order_index"),
  ]);

  const phaseIds = (phases ?? []).map((p) => p.id);
  const { data: topics } = await supabase
    .from("topics")
    .select("id, phase_id, title, order_index")
    .in("phase_id", phaseIds.length ? phaseIds : ["__none__"])
    .order("order_index");
  const topicIds = (topics ?? []).map((t) => t.id);
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .in("topic_id", topicIds.length ? topicIds : ["__none__"])
    .order("order_index");
  const resourceIds = (resources ?? []).map((r) => r.id);

  const [{ data: topicProgress }, { data: resourceProgress }] = await Promise.all([
    supabase.from("user_progress").select("topic_id, status"),
    supabase
      .from("user_resource_progress")
      .select("resource_id, status, seconds_watched, last_position_seconds, updated_at")
      .in("resource_id", resourceIds.length ? resourceIds : ["__none__"]),
  ]);

  const trackById = new Map((tracks ?? []).map((t) => [t.id, t]));
  const trackOrder = new Map((tracks ?? []).map((t, i) => [t.id, i]));
  const phaseTrack = new Map((phases ?? []).map((p) => [p.id, p.track_id]));
  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));
  const topicOrder = new Map((topics ?? []).map((t, i) => [t.id, i]));
  const doneTopicSet = new Set((topicProgress ?? []).filter((p) => p.status === "done").map((p) => p.topic_id));
  const progressByResource = new Map((resourceProgress ?? []).map((p) => [p.resource_id, p]));

  const rows = (resources ?? [])
    .map((r) => {
      const topic = topicById.get(r.topic_id);
      const trackId = topic ? phaseTrack.get(topic.phase_id) : undefined;
      const track = trackId ? trackById.get(trackId) : undefined;
      if (!topic || !track) return null;

      const rp = progressByResource.get(r.id);
      const status: ResourceBankStatus =
        rp?.status === "done" || doneTopicSet.has(topic.id)
          ? "done"
          : rp?.status === "in_progress"
            ? "in_progress"
            : "todo";

      const row: LibraryResource = {
        id: r.id,
        title: r.title,
        url: r.url,
        source: r.source,
        format: r.format,
        length: r.length,
        note: r.note,
        iconKey: r.icon_key,
        provider: r.provider,
        embeddable: r.embeddable,
        durationSeconds: r.duration_seconds,
        topicId: topic.id,
        topicTitle: topic.title,
        trackId: track.id,
        trackLabel: track.label,
        trackIconKey: track.icon_key,
        status,
        secondsWatched: rp?.seconds_watched ?? 0,
        lastPositionSeconds: rp?.last_position_seconds ?? 0,
        updatedAt: rp?.updated_at ?? null,
      };
      return row;
    })
    .filter((r): r is LibraryResource => r !== null);

  rows.sort(
    (a, b) =>
      (trackOrder.get(a.trackId) ?? 0) - (trackOrder.get(b.trackId) ?? 0) ||
      (topicOrder.get(a.topicId) ?? 0) - (topicOrder.get(b.topicId) ?? 0)
  );
  return rows;
}

export async function getResourceDetail(supabase: Client, resourceId: string) {
  const { data: resource } = await supabase.from("resources").select("*").eq("id", resourceId).single();
  if (!resource) return null;
  const { data: topic } = await supabase
    .from("topics")
    .select("id, title, phase_id")
    .eq("id", resource.topic_id)
    .single();
  if (!topic) return null;
  const { data: phase } = await supabase.from("phases").select("id, track_id").eq("id", topic.phase_id).single();
  const { data: track } = phase
    ? await supabase.from("tracks").select("id, label, icon_key").eq("id", phase.track_id).single()
    : { data: null };
  const { data: topicStatus } = await supabase
    .from("user_progress")
    .select("status")
    .eq("topic_id", topic.id)
    .maybeSingle();
  const { data: rp } = await supabase
    .from("user_resource_progress")
    .select("*")
    .eq("resource_id", resourceId)
    .maybeSingle();

  const status: ResourceBankStatus =
    rp?.status === "done" || topicStatus?.status === "done"
      ? "done"
      : rp?.status === "in_progress"
        ? "in_progress"
        : "todo";

  return {
    resource,
    topic,
    track,
    status,
    secondsWatched: rp?.seconds_watched ?? 0,
    lastPositionSeconds: rp?.last_position_seconds ?? 0,
  };
}

export async function getWatchStats(supabase: Client) {
  const { data: progress } = await supabase
    .from("user_resource_progress")
    .select("resource_id, seconds_watched, status");
  const rows = progress ?? [];
  const doneIds = rows.filter((r) => r.status === "done").map((r) => r.resource_id);

  const { data: doneResources } =
    doneIds.length > 0
      ? await supabase.from("resources").select("id, provider").in("id", doneIds)
      : { data: [] };

  return {
    secondsWatched: rows.reduce((sum, r) => sum + r.seconds_watched, 0),
    resourcesCompleted: doneIds.length,
    videosCompleted: (doneResources ?? []).filter((r) => r.provider === "youtube").length,
  };
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export interface PendingSkillUnlock {
  skillId: string;
  name: string;
  domain: string;
  description: string;
  iconKey: string | null;
  xpReward: number;
}

// Safety net for the unlock celebration: any RPC that can unlock a skill
// (set_topic_status, set_resource_progress, complete_resource) writes
// user_skills in the same transaction, so this always has the full list —
// even for a batch unlock, a cross-device unlock, or a refresh mid-animation.
export async function getPendingSkillUnlocks(supabase: Client): Promise<PendingSkillUnlock[]> {
  const { data: rows } = await supabase.from("user_skills").select("skill_id").is("seen_at", null);
  const skillIds = (rows ?? []).map((r) => r.skill_id);
  if (!skillIds.length) return [];

  const { data: skills } = await supabase.from("skills").select("*").in("id", skillIds);
  return (skills ?? []).map((s) => ({
    skillId: s.id,
    name: s.name,
    domain: s.domain,
    description: s.description,
    iconKey: s.icon_key,
    xpReward: s.xp_reward,
  }));
}

export interface SkillProgress {
  id: string;
  name: string;
  domain: string;
  description: string;
  iconKey: string | null;
  tier: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
  doneCount: number;
  totalCount: number;
}

// Mirrors evaluate_skills()'s consumed-resource logic in JS for display —
// read-only, so a plain RLS-scoped query is enough; no RPC needed.
export async function getSkillProgress(supabase: Client): Promise<SkillProgress[]> {
  const [{ data: skills }, { data: skillResources }, { data: userSkills }] = await Promise.all([
    supabase.from("skills").select("*").order("domain"),
    supabase.from("skill_resources").select("skill_id, resource_id"),
    supabase.from("user_skills").select("skill_id, unlocked_at"),
  ]);

  const resourceIds = [...new Set((skillResources ?? []).map((sr) => sr.resource_id))];
  const [{ data: resources }, { data: resourceProgress }] = await Promise.all([
    supabase.from("resources").select("id, topic_id").in("id", resourceIds.length ? resourceIds : ["__none__"]),
    supabase
      .from("user_resource_progress")
      .select("resource_id, status")
      .in("resource_id", resourceIds.length ? resourceIds : ["__none__"]),
  ]);
  const topicIds = [...new Set((resources ?? []).map((r) => r.topic_id))];
  const { data: topicProgress } = await supabase
    .from("user_progress")
    .select("topic_id, status")
    .in("topic_id", topicIds.length ? topicIds : ["__none__"]);

  const doneResourceSet = new Set(
    (resourceProgress ?? []).filter((p) => p.status === "done").map((p) => p.resource_id)
  );
  const doneTopicSet = new Set((topicProgress ?? []).filter((p) => p.status === "done").map((p) => p.topic_id));
  const topicByResource = new Map((resources ?? []).map((r) => [r.id, r.topic_id]));
  const consumedSet = new Set(
    resourceIds.filter((id) => doneResourceSet.has(id) || doneTopicSet.has(topicByResource.get(id) ?? ""))
  );
  const unlockedBySkill = new Map((userSkills ?? []).map((u) => [u.skill_id, u.unlocked_at]));

  return (skills ?? []).map((s) => {
    const mapped = (skillResources ?? []).filter((sr) => sr.skill_id === s.id);
    return {
      id: s.id,
      name: s.name,
      domain: s.domain,
      description: s.description,
      iconKey: s.icon_key,
      tier: s.tier,
      xpReward: s.xp_reward,
      unlocked: unlockedBySkill.has(s.id),
      unlockedAt: unlockedBySkill.get(s.id) ?? null,
      doneCount: mapped.filter((sr) => consumedSet.has(sr.resource_id)).length,
      totalCount: mapped.length,
    };
  });
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
