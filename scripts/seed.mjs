// One-time (and re-runnable) content seed script.
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

function loadTrack(file) {
  return JSON.parse(readFileSync(join(__dirname, 'seed-data', file), 'utf8'));
}

const TRACK_FILES = ['ai.json', 'finance.json', 'consulting.json'];

async function upsert(table, rows, label) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error(`Failed upserting ${label} into ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  const tracks = [];
  const allPhases = [];
  const allTopics = [];
  const allResources = [];

  TRACK_FILES.forEach((file, i) => {
    const data = loadTrack(file);
    tracks.push({ ...data.track, order_index: i + 1 });
    allPhases.push(...data.phases);
    allTopics.push(...data.topics);
    allResources.push(...data.resources);
  });

  console.log(`Seeding ${tracks.length} tracks, ${allPhases.length} phases, ${allTopics.length} topics, ${allResources.length} resources...`);

  // Order matters: parents before children, because of foreign keys.
  await upsert('tracks', tracks, 'tracks');
  await upsert('phases', allPhases, 'phases');
  await upsert('topics', allTopics, 'topics');
  await upsert('resources', allResources, 'resources');

  console.log('Done. All three tracks are now live in the database.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
