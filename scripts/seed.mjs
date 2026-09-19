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

const TRACK_FILES = [
  'ai.json',
  'finance.json',
  'consulting.json',
  'excel.json',
  'psychology.json',
  'marketing.json',
  'data.json',
  'product.json',
  'sales.json',
  'ux.json',
  'operations.json',
  'cybersecurity.json',
  'people.json',
  'market_research.json',
  // sustainability.json intentionally excluded - that track is soft-hidden
  // (see migration 0007_hide_sustainability_track.sql) rather than deleted,
  // so re-seeding must not touch it or re-publish it.
  // Job-ready tracks (batch 2)
  'prompt_engineering.json',
  'ai_nocode.json',
  'langchain_rag.json',
  'sql_analytics.json',
  'fpa_reporting.json',
  'startup_finance.json',
  'negotiation.json',
  'exec_communication.json',
  'tech_writing.json',
  'personal_branding.json',
];

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

  return {
    ...r,
    icon: null,
    provider,
    external_id: externalId,
    embeddable,
    icon_key: iconKey,
    duration_seconds: r.duration_seconds ?? null,
  };
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

async function main() {
  const tracks = [];
  const allPhases = [];
  const allTopics = [];
  const allResources = [];

  TRACK_FILES.forEach((file, i) => {
    const data = loadJson(file);
    tracks.push({ ...data.track, order_index: i + 1 });
    allPhases.push(...data.phases);
    allTopics.push(...data.topics.map(({ status: _s, ...t }) => t));
    allResources.push(...data.resources.map(deriveResourceMedia));
  });

  const skillsData = loadJson('skills.json');
  const cohortsData = loadJson('cohorts.json');

  console.log(
    `Seeding ${tracks.length} tracks, ${allPhases.length} phases, ${allTopics.length} topics, ` +
      `${allResources.length} resources, ${skillsData.skills.length} skills, ${cohortsData.cohorts.length} cohorts...`
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

  console.log('Done. All tracks, skills and cohorts are now live in the database.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
