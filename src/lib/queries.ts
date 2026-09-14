import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Status, Step, Tier } from "@/lib/database.types";

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

interface SkillResourceRow {
  skill_id: string;
  skills: { name: string } | null;
  resources: { topic_id: string; topics: { phase_id: string; phases: { track_id: string } | null } | null } | null;
}

// Every skill a track can grant: a skill counts if any of its mapped
// resources belongs to a topic under that track. One nested select
// (skill_resources -> skills, and skill_resources -> resources -> topics ->
// phases) replaces what used to be 5 fully sequential round-trips.
async function getSkillNamesByTrack(supabase: Client): Promise<Map<string, string[]>> {
  const { data } = await supabase
    .from("skill_resources")
    .select("skill_id, skills(name), resources(topic_id, topics(phase_id, phases(track_id)))");
  const skillResources = (data ?? []) as unknown as SkillResourceRow[];
  if (!skillResources.length) return new Map();

  const trackSkillNames = new Map<string, Set<string>>();
  for (const sr of skillResources) {
    const trackId = sr.resources?.topics?.phases?.track_id;
    const name = sr.skills?.name;
    if (!trackId || !name) continue;
    if (!trackSkillNames.has(trackId)) trackSkillNames.set(trackId, new Set());
    trackSkillNames.get(trackId)!.add(name);
  }

  const result = new Map<string, string[]>();
  for (const [trackId, names] of trackSkillNames) result.set(trackId, [...names]);
  return result;
}

interface MarketplaceTrackRow {
  id: string;
  label: string;
  summary: string;
  tier: string;
  domain: string | null;
  estimated_hours: number | null;
  effort_per_week: string | null;
  icon_key: string | null;
  phases: { topics: { id: string; resources: { id: string }[] }[] }[];
}

// One nested select (tracks -> phases -> topics -> resources) replaces
// what used to be 3 sequential round-trips just to count topics/resources
// per track — the counts are now plain array-length sums in JS.
export async function getMarketplaceCourses(supabase: Client): Promise<MarketplaceCourse[]> {
  const [{ data: trackRows }, enrolledIds, skillsByTrack] = await Promise.all([
    supabase
      .from("tracks")
      .select(
        "id, label, summary, tier, domain, estimated_hours, effort_per_week, icon_key, " +
          "phases(topics(id, resources(id)))"
      )
      .eq("published", true)
      .order("order_index"),
    getSelectedTracks(supabase),
    getSkillNamesByTrack(supabase),
  ]);

  const tracks = (trackRows ?? []) as unknown as MarketplaceTrackRow[];
  const enrolledSet = new Set(enrolledIds);

  return tracks.map((t) => {
    let topicCount = 0;
    let resourceCount = 0;
    for (const phase of t.phases) {
      topicCount += phase.topics.length;
      for (const topic of phase.topics) resourceCount += topic.resources.length;
    }
    return {
      id: t.id,
      label: t.label,
      summary: t.summary,
      tier: t.tier,
      domain: t.domain,
      estimatedHours: t.estimated_hours,
      effortPerWeek: t.effort_per_week,
      iconKey: t.icon_key,
      topicCount,
      resourceCount,
      skillNames: skillsByTrack.get(t.id) ?? [],
      enrolled: enrolledSet.has(t.id),
    };
  });
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

interface CourseDetailRow {
  id: string;
  name: string;
  label: string;
  order_index: number;
  tier: string;
  summary: string;
  domain: string | null;
  estimated_hours: number | null;
  effort_per_week: string | null;
  icon_key: string | null;
  published: boolean;
  phases: {
    id: string;
    title: string;
    description: string;
    estimated_weeks: string | null;
    order_index: number;
    topics: { id: string; title: string; order_index: number; resources: { id: string }[] }[];
  }[];
}

// One nested select (track -> phases -> topics -> resources) replaces the
// old pattern of calling getMarketplaceCourses() (which itself queries
// every published track) just to read one track's counts, plus 2 more
// sequential round-trips for phases/topics.
export async function getCourseDetail(supabase: Client, trackId: string) {
  const [{ data: row }, skillsByTrack, enrolledIds] = await Promise.all([
    supabase
      .from("tracks")
      .select(
        "*, phases(id, title, description, estimated_weeks, order_index, " +
          "topics(id, title, order_index, resources(id)))"
      )
      .eq("id", trackId)
      .maybeSingle(),
    getSkillNamesByTrack(supabase),
    getSelectedTracks(supabase),
  ]);
  if (!row) return null;

  const { phases: rawPhases, ...track } = row as unknown as CourseDetailRow;
  const phases = [...rawPhases]
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      estimated_weeks: p.estimated_weeks,
      topics: [...p.topics]
        .sort((a, b) => a.order_index - b.order_index)
        .map((t) => ({ id: t.id, phase_id: p.id, title: t.title })),
    }));
  const topicCount = phases.reduce((n, p) => n + p.topics.length, 0);
  const resourceCount = rawPhases.reduce(
    (n, p) => n + p.topics.reduce((m, t) => m + t.resources.length, 0),
    0
  );

  return {
    track,
    enrolled: enrolledIds.includes(trackId),
    topicCount,
    resourceCount,
    skillNames: skillsByTrack.get(trackId) ?? [],
    phases,
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

interface TrackSummaryRow {
  id: string;
  name: string;
  label: string;
  phases: {
    id: string;
    order_index: number;
    title: string;
    topics: { id: string; title: string; order_index: number }[];
  }[];
}

// Dashboard: one row per track the user has selected, with overall
// completion and a "continue where you left off" pointer.
//
// One nested PostgREST select (tracks -> phases -> topics) replaces what
// used to be 4 fully sequential round-trips — the real FK chain
// (phases.track_id / topics.phase_id) makes this a single query even
// though `database.types.ts` declares `Relationships: []` (a compile-time
// simplification, not a schema limitation; PostgREST resolves embeds from
// the live FK constraints, not from the hand-written types).
export async function getTrackSummaries(supabase: Client, trackIds: string[]): Promise<TrackProgressSummary[]> {
  if (!trackIds.length) return [];

  const [{ data: trackRows }, { data: progress }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, name, label, order_index, phases(id, order_index, title, topics(id, title, order_index))")
      .in("id", trackIds)
      .order("order_index"),
    supabase.from("user_progress").select("topic_id, status"),
  ]);

  const tracks = (trackRows ?? []) as unknown as TrackSummaryRow[];
  const statusByTopic = new Map((progress ?? []).map((p) => [p.topic_id, p.status]));

  return tracks.map((track) => {
    const phases = [...track.phases].sort((a, b) => a.order_index - b.order_index);
    const trackTopics = phases.flatMap((phase) =>
      [...phase.topics]
        .sort((a, b) => a.order_index - b.order_index)
        .map((t) => ({ ...t, phaseTitle: phase.title }))
    );
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
        ? { id: nextTopic.id, title: nextTopic.title, phaseTitle: nextTopic.phaseTitle }
        : null,
    };
  });
}

interface TrackDetailRow {
  id: string;
  name: string;
  label: string;
  order_index: number;
  tier: Tier;
  summary: string;
  domain: string | null;
  estimated_hours: number | null;
  effort_per_week: string | null;
  icon_key: string | null;
  published: boolean;
  phases: {
    id: string;
    track_id: string;
    order_index: number;
    title: string;
    description: string;
    estimated_weeks: string | null;
    color: string | null;
    topics: {
      id: string;
      phase_id: string;
      order_index: number;
      title: string;
      section: string | null;
      tags: string[];
      estimated_time: string | null;
      description: string;
      steps: Step[];
      user_progress: { status: string }[];
    }[];
  }[];
}

// One nested select (track -> phases -> topics, with user_progress
// embedded under topics via its own FK) replaces 4 sequential round-trips
// with 1 — this page is one of the most frequently visited in the app.
export async function getTrackDetail(supabase: Client, trackId: string) {
  const { data: row } = await supabase
    .from("tracks")
    .select("*, phases(*, topics(*, user_progress(status)))")
    .eq("id", trackId)
    .maybeSingle();
  if (!row) return { track: null, phases: [] };

  const { phases: rawPhases, ...track } = row as unknown as TrackDetailRow;
  const phases = [...rawPhases]
    .sort((a, b) => a.order_index - b.order_index)
    .map((phase) => {
      const { topics: rawTopics, ...phaseFields } = phase;
      return {
        ...phaseFields,
        topics: [...rawTopics]
          .sort((a, b) => a.order_index - b.order_index)
          .map((t) => {
            const { user_progress, ...topicFields } = t;
            return { ...topicFields, status: (user_progress?.[0]?.status as Status) ?? ("todo" as Status) };
          }),
      };
    });

  return { track, phases };
}

// Full content tree for one track (no per-user status) — used by the admin
// content editor.
interface ContentTreeRow {
  id: string;
  name: string;
  label: string;
  order_index: number;
  phases: {
    id: string;
    track_id: string;
    order_index: number;
    title: string;
    description: string;
    estimated_weeks: string | null;
    color: string | null;
    topics: {
      id: string;
      phase_id: string;
      order_index: number;
      title: string;
      section: string | null;
      tags: string[];
      estimated_time: string | null;
      description: string;
      steps: Step[];
      resources: Database["public"]["Tables"]["resources"]["Row"][];
    }[];
  }[];
}

// Full content tree for one track (no per-user status) — used by the admin
// content editor. One nested select replaces 4 sequential round-trips.
export async function getTrackContentTree(supabase: Client, trackId: string) {
  const { data: row } = await supabase
    .from("tracks")
    .select("*, phases(*, topics(*, resources(*)))")
    .eq("id", trackId)
    .maybeSingle();
  if (!row) return { track: null, phases: [] };

  const { phases: rawPhases, ...track } = row as unknown as ContentTreeRow;
  const phases = [...rawPhases]
    .sort((a, b) => a.order_index - b.order_index)
    .map((phase) => ({
      ...phase,
      topics: [...phase.topics]
        .sort((a, b) => a.order_index - b.order_index)
        .map((topic) => ({
          ...topic,
          resources: [...topic.resources].sort((a, b) => a.order_index - b.order_index),
        })),
    }));

  return { track, phases };
}

export type ResourceBankStatus = "todo" | "in_progress" | "done";

interface TopicDetailRow {
  id: string;
  phase_id: string;
  order_index: number;
  title: string;
  section: string | null;
  tags: string[];
  estimated_time: string | null;
  description: string;
  steps: Step[];
  phases: { id: string; track_id: string; order_index: number; title: string; description: string; estimated_weeks: string | null; color: string | null } | null;
  user_progress: { status: string }[];
  resources: {
    id: string;
    topic_id: string;
    order_index: number;
    title: string;
    url: string;
    source: string | null;
    format: string | null;
    length: string | null;
    note: string | null;
    provider: string | null;
    external_id: string | null;
    duration_seconds: number | null;
    embeddable: boolean;
    icon_key: string | null;
    user_resource_progress: { status: string }[];
  }[];
}

// One nested select (topic -> phase, topic -> user_progress, topic ->
// resources -> user_resource_progress, all real FKs) replaces 5 fully
// sequential round-trips with 1 — this is the core "learning loop" page.
export async function getTopicDetail(supabase: Client, topicId: string) {
  const { data: row } = await supabase
    .from("topics")
    .select("*, phases(*), user_progress(status), resources(*, user_resource_progress(status))")
    .eq("id", topicId)
    .maybeSingle();
  if (!row) return null;

  const { phases: phase, user_progress, resources: rawResources, ...topic } = row as unknown as TopicDetailRow;
  const status = (user_progress?.[0]?.status as Status) ?? ("todo" as Status);

  const resources = [...rawResources]
    .sort((a, b) => a.order_index - b.order_index)
    .map((res) => {
      const { user_resource_progress, ...resFields } = res;
      const rStatus = user_resource_progress?.[0]?.status;
      return {
        ...resFields,
        status: (rStatus === "done" || status === "done"
          ? "done"
          : rStatus === "in_progress"
            ? "in_progress"
            : "todo") as ResourceBankStatus,
      };
    });

  return { topic, phase, resources, status };
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

interface LibraryTrackRow {
  id: string;
  label: string;
  icon_key: string | null;
  phases: {
    order_index: number;
    topics: {
      id: string;
      title: string;
      order_index: number;
      user_progress: { status: string }[];
      resources: {
        id: string;
        title: string;
        url: string;
        source: string | null;
        format: string | null;
        length: string | null;
        note: string | null;
        icon_key: string | null;
        provider: string | null;
        embeddable: boolean;
        duration_seconds: number | null;
        order_index: number;
        user_resource_progress: {
          status: string;
          seconds_watched: number;
          last_position_seconds: number;
          updated_at: string;
        }[];
      }[];
    }[];
  }[];
}

// One nested select (tracks -> phases -> topics -> resources, with both
// per-user progress tables embedded via their own FKs) replaces what used
// to be 4 sequential content round-trips plus 2 more for progress.
// Traversing in the query's own nested order (top-level tracks ordered by
// `order_index`, sorted by the same field at each inner level) means the
// result is already in track/topic order — no separate re-sort needed.
export async function getLibraryResources(supabase: Client, trackIds: string[]): Promise<LibraryResource[]> {
  if (!trackIds.length) return [];

  const { data } = await supabase
    .from("tracks")
    .select(
      "id, label, icon_key, phases(order_index, topics(id, title, order_index, user_progress(status), " +
        "resources(id, title, url, source, format, length, note, icon_key, provider, embeddable, " +
        "duration_seconds, order_index, user_resource_progress(status, seconds_watched, last_position_seconds, updated_at))))"
    )
    .in("id", trackIds)
    .order("order_index");

  const tracks = (data ?? []) as unknown as LibraryTrackRow[];
  const rows: LibraryResource[] = [];

  for (const track of tracks) {
    const phases = [...track.phases].sort((a, b) => a.order_index - b.order_index);
    for (const phase of phases) {
      const topics = [...phase.topics].sort((a, b) => a.order_index - b.order_index);
      for (const topic of topics) {
        const doneTopic = topic.user_progress?.[0]?.status === "done";
        const resources = [...topic.resources].sort((a, b) => a.order_index - b.order_index);
        for (const r of resources) {
          const rp = r.user_resource_progress?.[0];
          const status: ResourceBankStatus =
            rp?.status === "done" || doneTopic ? "done" : rp?.status === "in_progress" ? "in_progress" : "todo";

          rows.push({
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
          });
        }
      }
    }
  }

  return rows;
}

interface ResourceDetailRow {
  id: string;
  topic_id: string;
  order_index: number;
  title: string;
  url: string;
  source: string | null;
  format: string | null;
  length: string | null;
  note: string | null;
  provider: string | null;
  external_id: string | null;
  duration_seconds: number | null;
  embeddable: boolean;
  icon_key: string | null;
  user_resource_progress: { status: string; seconds_watched: number; last_position_seconds: number }[];
  topics: {
    id: string;
    title: string;
    phase_id: string;
    user_progress: { status: string }[];
    phases: { id: string; track_id: string; tracks: { id: string; label: string; icon_key: string | null } | null } | null;
  } | null;
}

// One nested select (resources -> topics -> phases -> tracks, with the
// two per-user progress tables embedded alongside via their own FKs to
// resources/topics) replaces 6 fully sequential round-trips with 1 — RLS
// still scopes the embedded user_progress/user_resource_progress rows to
// the caller, exactly as if queried directly.
export async function getResourceDetail(supabase: Client, resourceId: string) {
  const { data: row } = await supabase
    .from("resources")
    .select(
      "id, topic_id, order_index, title, url, source, format, length, note, provider, external_id, " +
        "duration_seconds, embeddable, icon_key, " +
        "user_resource_progress(status, seconds_watched, last_position_seconds), " +
        "topics(id, title, phase_id, user_progress(status), phases(id, track_id, tracks(id, label, icon_key)))"
    )
    .eq("id", resourceId)
    .maybeSingle();
  if (!row) return null;

  const r = row as unknown as ResourceDetailRow;
  const { user_resource_progress, topics, ...resource } = r;
  const topic = topics ? { id: topics.id, title: topics.title, phase_id: topics.phase_id } : null;
  if (!topic) return null;
  const track = topics?.phases?.tracks ?? null;
  const rp = user_resource_progress?.[0];
  const topicStatus = topics?.user_progress?.[0]?.status;

  const status: ResourceBankStatus =
    rp?.status === "done" || topicStatus === "done"
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

interface SpacedRepetitionRow {
  topic_id: string;
  reps: number;
  next_review_date: string;
  topics: { title: string; section: string | null; estimated_time: string | null; phases: { title: string } | null } | null;
}

// Embedding topics/phases directly under spaced_repetition (both real FKs)
// replaces what used to be 2 extra sequential round-trips (topics, then
// phases) with nothing extra at all — due/upcoming stay the only 2 queries,
// now run fully in parallel with no follow-up.
export async function getReviewQueue(supabase: Client) {
  const today = new Date().toISOString().slice(0, 10);
  const embed = "topic_id, reps, next_review_date, topics(title, section, estimated_time, phases(title))";

  const [{ data: due }, { data: upcoming }] = await Promise.all([
    supabase.from("spaced_repetition").select(embed).lte("next_review_date", today).order("next_review_date"),
    supabase
      .from("spaced_repetition")
      .select(embed)
      .gt("next_review_date", today)
      .order("next_review_date")
      .limit(6),
  ]);

  function toItem(row: SpacedRepetitionRow): ReviewItem | null {
    if (!row.topics) return null;
    return {
      topicId: row.topic_id,
      title: row.topics.title,
      phaseTitle: row.topics.phases?.title ?? "",
      section: row.topics.section,
      estimatedTime: row.topics.estimated_time,
      reps: row.reps,
      nextReviewDate: row.next_review_date,
    };
  }

  const dueRows = (due ?? []) as unknown as SpacedRepetitionRow[];
  const upcomingRows = (upcoming ?? []) as unknown as SpacedRepetitionRow[];

  return {
    due: dueRows.map(toItem).filter((x): x is ReviewItem => !!x),
    upcoming: upcomingRows.map(toItem).filter((x): x is ReviewItem => !!x),
  };
}

export async function getBuildProjects(supabase: Client) {
  const { data } = await supabase.from("build_projects").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

interface CompletedTopicsTrackRow {
  id: string;
  label: string;
  phases: {
    topics: { title: string; user_progress: { status: string; completed_at: string | null }[] }[];
  }[];
}

// Scoped to the caller's enrolled tracks — with the catalogue growing past
// 250+ topics, pulling every track/phase/topic regardless of enrollment
// would waste most of the query on tracks the user never joined. One
// nested select (tracks -> phases -> topics -> user_progress) replaces
// what used to be 4 sequential round-trips.
export async function getCompletedTopicsByTrack(supabase: Client, trackIds: string[]) {
  if (!trackIds.length) return [];

  const { data } = await supabase
    .from("tracks")
    .select("id, label, phases(topics(title, user_progress(status, completed_at)))")
    .in("id", trackIds)
    .order("order_index");

  const tracks = (data ?? []) as unknown as CompletedTopicsTrackRow[];

  return tracks.map((track) => {
    const doneTopics: { title: string; completedAt: string | null }[] = [];
    for (const phase of track.phases) {
      for (const topic of phase.topics) {
        const progress = topic.user_progress?.[0];
        if (progress?.status === "done") {
          doneTopics.push({ title: topic.title, completedAt: progress.completed_at });
        }
      }
    }
    return { track: { id: track.id, label: track.label }, doneTopics };
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
