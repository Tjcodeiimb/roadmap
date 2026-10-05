// One-time (and re-runnable) content seed script. Also runs automatically
// via .github/workflows/seed.yml whenever scripts/seed-data/ changes.
//
// Loads the AI / Finance / Consulting track content from scripts/seed-data/*.json
// and upserts it into Supabase. Content only — it never touches any user's
// personal progress, XP, streak, or spaced-repetition rows.
//
// Usage (see docs/SETUP.md for the full walkthrough):
//   node --env-file=.env.local scripts/seed.mjs
//
// Requires two env vars, both from Supabase Project Settings -> API:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (secret — server-side only, never in the browser)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TRACK_FILES } from './lib/track-files.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n' +
      '(e.g. in .env.local) and run with: node --env-file=.env.local scripts/seed.mjs'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function loadJson(file) {
  return JSON.parse(readFileSync(join(__dirname, 'seed-data', file), 'utf8'));
}


// Mirrors migration 0002's SQL backfill in JS — same priority order,
// including the legacy emoji fallback — so re-seeding is idempotent for the
// original 3 tracks (whose seed-data JSON still carries the pre-icon-system
// emoji in `icon`) as well as correct for newly-authored ones.
const EMOJI_ICON_KEY = {
  '🎓': 'course',
  '📄': 'article',
  '🧪': 'practice',
  '📺': 'video',
  '🧭': 'guide',
  '🌐': 'web',
};

// Valid columns for the resources table (0001 + 0002 additions).
// Any field in a seed JSON that isn't here gets stripped before upsert.
const RESOURCE_COLUMNS = new Set([
  'id', 'topic_id', 'order_index', 'title', 'url', 'source', 'format',
  'length', 'note', 'icon', 'provider', 'external_id', 'duration_seconds',
  'embeddable', 'icon_key',
]);

function deriveResourceMedia(r) {
  const watch = r.url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/);
  const short = r.url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  const externalId = watch?.[1] ?? short?.[1] ?? null;
  const isYouTube = /youtube\.com|youtu\.be/i.test(r.url);
  const isVimeo = /vimeo\.com/i.test(r.url);
  const provider = isYouTube ? 'youtube' : isVimeo ? 'vimeo' : 'external';
  const embeddable = provider === 'youtube' && externalId != null;

  const format = (r.format ?? '').toLowerCase();
  let iconKey = r.icon_key ?? null;
  if (!iconKey) {
    if (provider === 'youtube') iconKey = 'video';
    else if (r.icon && EMOJI_ICON_KEY[r.icon]) iconKey = EMOJI_ICON_KEY[r.icon];
    else if (format.includes('video')) iconKey = 'video';
    else if (format.includes('course')) iconKey = 'course';
    else if (format.includes('article') || format.includes('pdf') || format.includes('textbook')) iconKey = 'article';
    else if (format.includes('practice') || format.includes('exercise')) iconKey = 'practice';
    else iconKey = 'web';
  }

  const derived = {
    ...r,
    icon: null,
    provider,
    external_id: externalId,
    embeddable,
    icon_key: iconKey,
    // Some seed files use `duration` (plain string) instead of `duration_seconds` (int).
    duration_seconds: r.duration_seconds ?? null,
  };

  // Strip any keys not in the schema so PostgREST never sees an unknown column.
  return Object.fromEntries(Object.entries(derived).filter(([k]) => RESOURCE_COLUMNS.has(k)));
}

// cohort_courses and skill_resources are composite-PK tables, so
// `onConflict: 'id'` doesn't apply — each table needs its own conflict target.
async function upsert(table, rows, conflictTarget = 'id') {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictTarget });
  if (error) {
    console.error(`Failed upserting into ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

// Content for a feature whose migration may not have been applied yet.
//
// Migrations are run by hand in the Supabase SQL editor, but this script runs
// automatically on push. So there is always a window where the seed data for a
// new feature has landed and its tables have not. Failing hard there would
// block every *other* content change in the same push — new course topics,
// fixed links — behind an unrelated manual step. A missing table is reported
// and skipped instead; the next run picks it up once the migration is in.
async function upsertWhenReady(table, rows, migration, conflictTarget = 'id') {
  if (!rows.length) return true;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: conflictTarget });
  if (!error) {
    console.log(`  ${table}: ${rows.length} rows`);
    return true;
  }
  // PostgREST reports an unknown table as 42P01, or as a schema-cache miss
  // (PGRST205) when the table is genuinely absent rather than just unreadable.
  const missing = error.code === '42P01' || error.code === 'PGRST205';
  if (missing) {
    console.warn(
      `  ${table}: skipped — table not found. Run ${migration} in the Supabase ` +
        'SQL editor, then re-run this seed (or push again).'
    );
    return false;
  }
  console.error(`Failed upserting into ${table}:`, error.message);
  process.exit(1);
}

// tracks is the one table whose rows have genuinely different shapes: the
// original 3 tracks carry only {id, name, label} (their marketplace metadata
// comes from migration 0003's UPDATE, not from seed data), while the 6 newer
// tracks carry the full marketplace metadata inline. Batching heterogeneous
// objects into a single upsert() call makes PostgREST fill each row's
// missing keys with an explicit SQL NULL (not "leave column untouched" and
// not "use the column default") — which then fails the `tier`/`summary`
// NOT NULL constraints for the 3 older tracks. One row per call sidesteps
// that: each call only ever sees the keys that row actually has.
async function upsertEach(table, rows, conflictTarget = 'id') {
  for (const row of rows) {
    const { error } = await supabase.from(table).upsert([row], { onConflict: conflictTarget });
    if (error) {
      console.error(`Failed upserting ${row.id} into ${table}:`, error.message);
      process.exit(1);
    }
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

// Upserting never deletes, so every course ever dropped from a cohort stayed in
// it in production: a database check found seven such leftovers, including
// Finance still inside Founder after 0016 removed it. cohorts.json is the
// source of truth for which courses a cohort contains, so remove any link it no
// longer lists.
//
// Scoped to cohorts defined in cohorts.json, and to the link table only: no
// cohort, course or learner row is touched. Removing a link does not unenroll
// anyone — enrollments live in user_track_selection.
async function pruneCohortCourses(cohortsData) {
  const cohortIds = cohortsData.cohorts.map((c) => c.id);
  const wanted = new Set(cohortsData.cohort_courses.map((l) => `${l.cohort_id}|${l.track_id}`));
  const { data, error } = await supabase
    .from('cohort_courses')
    .select('cohort_id, track_id')
    .in('cohort_id', cohortIds);
  if (error) {
    console.error('Failed reading cohort_courses:', error.message);
    process.exit(1);
  }
  const stale = data.filter((l) => !wanted.has(`${l.cohort_id}|${l.track_id}`));
  for (const l of stale) {
    const { error: delError } = await supabase
      .from('cohort_courses')
      .delete()
      .eq('cohort_id', l.cohort_id)
      .eq('track_id', l.track_id);
    if (delError) {
      console.error(`Failed removing ${l.cohort_id} -> ${l.track_id}:`, delError.message);
      process.exit(1);
    }
    console.log(`  cohort_courses: removed ${l.cohort_id} -> ${l.track_id} (no longer in cohorts.json)`);
  }
}

// Same problem as cohort_courses — upserting never deletes — but with a
// learner-data twist. project_stage_resources carry no user data, so a link
// dropped from the seed is safe to delete. project_stages do: a stage row has
// user_project_stages hanging off it with the learner's status and notes, and
// ON DELETE CASCADE would take them. So a stage that disappears from the seed
// is REPORTED, never deleted — removing it is a deliberate admin decision
// about someone's work, not a side effect of editing a JSON file.
async function pruneProjectContent(projectsData) {
  const playbookIds = projectsData.playbooks.map((p) => p.id);
  if (!playbookIds.length) return;

  const wantedStages = new Set(projectsData.stages.map((s) => s.id));
  const { data: stages, error: stageError } = await supabase
    .from('project_stages')
    .select('id, playbook_id')
    .in('playbook_id', playbookIds);
  if (stageError) {
    console.error('Failed reading project_stages:', stageError.message);
    process.exit(1);
  }

  const staleStages = stages.filter((s) => !wantedStages.has(s.id));
  for (const s of staleStages) {
    console.warn(
      `  project_stages: "${s.id}" is live but no longer in projects.json. ` +
        'Left in place — deleting it would cascade away any notes and progress ' +
        'learners recorded against it. Remove it by hand if that is intended.'
    );
  }

  const wantedResources = new Set(projectsData.stage_resources.map((r) => r.id));
  const liveStageIds = stages.map((s) => s.id);
  if (!liveStageIds.length) return;

  const { data: resources, error: resourceError } = await supabase
    .from('project_stage_resources')
    .select('id, stage_id')
    .in('stage_id', liveStageIds);
  if (resourceError) {
    console.error('Failed reading project_stage_resources:', resourceError.message);
    process.exit(1);
  }

  const stale = resources.filter((r) => !wantedResources.has(r.id));
  for (const r of stale) {
    const { error } = await supabase.from('project_stage_resources').delete().eq('id', r.id);
    if (error) {
      console.error(`Failed removing project_stage_resources ${r.id}:`, error.message);
      process.exit(1);
    }
    console.log(`  project_stage_resources: removed ${r.id} (no longer in projects.json)`);
  }
}

async function main() {
  const tracks = [];
  const allPhases = [];
  const allTopics = [];
  const allResources = [];

  TRACK_FILES.forEach((file, i) => {
    const data = loadJson(file);
    tracks.push({ ...data.track, order_index: i + 1 });
    allPhases.push(...data.phases);
    allTopics.push(...data.topics.map(({ status: _s, ...t }) => ({
      tags: [],
      description: '',
      steps: [],
      ...t,
    })));
    allResources.push(...data.resources.map(deriveResourceMedia));
  });

  const skillsData = loadJson('skills.json');
  const cohortsData = loadJson('cohorts.json');
  const equivalencesData = loadJson('topic_equivalences.json');
  const projectsData = loadJson('projects.json');

  console.log(
    `Seeding ${tracks.length} tracks, ${allPhases.length} phases, ${allTopics.length} topics, ` +
      `${allResources.length} resources, ${skillsData.skills.length} skills, ${cohortsData.cohorts.length} cohorts, ` +
      `${equivalencesData.topic_equivalence_groups.length} topic equivalences, ` +
      `${projectsData.playbooks.length} project playbooks...`
  );

  // Order matters throughout: parents before children, because of foreign keys.
  await upsertEach('tracks', tracks);
  await upsert('phases', allPhases);
  await upsert('topics', allTopics);
  await upsert('resources', allResources);
  await upsert('skills', skillsData.skills);
  await upsert('cohorts', cohortsData.cohorts);
  await upsert('cohort_courses', cohortsData.cohort_courses, 'cohort_id,track_id');
  await upsert('skill_resources', skillsData.skill_resources, 'skill_id,resource_id');
  await upsert('topic_equivalence_groups', equivalencesData.topic_equivalence_groups, 'group_id,topic_id');

  // Projects come after skills and tracks: project_stages references both.
  const M = '0033_projects.sql';
  const projectsReady =
    (await upsertWhenReady('project_playbooks', projectsData.playbooks, M)) &&
    (await upsertWhenReady('project_stages', projectsData.stages, M)) &&
    (await upsertWhenReady('project_stage_resources', projectsData.stage_resources, M));

  await pruneCohortCourses(cohortsData);
  if (projectsReady) await pruneProjectContent(projectsData);

  console.log('Done. All tracks, skills, cohorts and project playbooks are now live.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
