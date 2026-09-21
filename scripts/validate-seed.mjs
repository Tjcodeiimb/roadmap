// Structural validation for every seed-data file — run before scripts/seed.mjs.
// (Also runs automatically via .github/workflows/seed.yml.)
//
// The single most destructive failure mode here is a reused text PK: phases,
// topics and resources all use global text ids, and an upsert with a
// collision silently overwrites (and cascade-deletes the children of)
// whatever already used that id. ai.json's own phases are bare `ph1`..`ph7`
// (not namespaced), so this has to be enforced by a validator, not by care.
//
// Usage: node scripts/validate-seed.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'seed-data');

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
  // sustainability.json intentionally excluded - soft-hidden, not seeded.
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

let errors = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  errors++;
}
function warn(msg) {
  console.warn(`  WARN: ${msg}`);
  warnings++;
}

function loadJson(file) {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
  } catch (err) {
    fail(`${file}: could not read/parse (${err.message})`);
    return null;
  }
}

function deriveYouTube(url) {
  const watch = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/);
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  const id = watch?.[1] ?? short?.[1] ?? null;
  const isYouTubeHost = /youtube\.com|youtu\.be/i.test(url);
  return { isYouTubeHost, id };
}

function main() {
  const tracks = new Map(); // id -> file
  const phases = new Map();
  const topics = new Map();
  const resources = new Map();
  const allUrls = new Map(); // url -> [resource ids]

  console.log(`Validating ${TRACK_FILES.length} track files...`);

  for (const file of TRACK_FILES) {
    const data = loadJson(file);
    if (!data) continue;

    const { track, phases: filePhases = [], topics: fileTopics = [], resources: fileResources = [] } = data;

    if (!track?.id) {
      fail(`${file}: missing track.id`);
      continue;
    }
    if (tracks.has(track.id)) {
      fail(`${file}: duplicate track id "${track.id}" (also in ${tracks.get(track.id)})`);
    }
    tracks.set(track.id, file);

    const VALID_TIERS = ['foundational', 'intermediate', 'advanced'];
    if (track.tier && !VALID_TIERS.includes(track.tier)) {
      fail(`${file}: track "${track.id}" has invalid tier "${track.tier}"`);
    }
    // Marketplace metadata is only required for newly-authored tracks; the
    // original 3 get it from migration 0003's backfill instead.
    const isNewTrack = !['ai', 'finance', 'consulting'].includes(track.id);
    if (isNewTrack) {
      if (!track.tier) fail(`${file}: track "${track.id}" missing tier`);
      if (!track.summary) fail(`${file}: track "${track.id}" missing summary`);
      if (!track.domain) fail(`${file}: track "${track.id}" missing domain`);
      if (track.estimated_hours == null) fail(`${file}: track "${track.id}" missing estimated_hours`);
      if (!track.effort_per_week) warn(`${file}: track "${track.id}" missing effort_per_week`);
      if (!track.icon_key) warn(`${file}: track "${track.id}" missing icon_key`);
    }

    for (const phase of filePhases) {
      if (phases.has(phase.id)) {
        fail(`${file}: duplicate phase id "${phase.id}" (also in ${phases.get(phase.id).file})`);
        continue;
      }
      if (phase.track_id !== track.id) {
        fail(`${file}: phase "${phase.id}" has track_id "${phase.track_id}" but file's track is "${track.id}"`);
      }
      phases.set(phase.id, { file, trackId: track.id });
    }

    for (const topic of fileTopics) {
      if (topics.has(topic.id)) {
        fail(`${file}: duplicate topic id "${topic.id}" (also in ${topics.get(topic.id).file})`);
        continue;
      }
      if (!phases.has(topic.phase_id)) {
        fail(`${file}: topic "${topic.id}" references unknown phase_id "${topic.phase_id}"`);
      }
      topics.set(topic.id, { file });
    }

    for (const resource of fileResources) {
      if (resources.has(resource.id)) {
        fail(`${file}: duplicate resource id "${resource.id}" (also in ${resources.get(resource.id).file})`);
        continue;
      }
      if (!topics.has(resource.topic_id)) {
        fail(`${file}: resource "${resource.id}" references unknown topic_id "${resource.topic_id}"`);
      }
      // `duration` is not a column. Five seed files once used it instead of
      // `length`, and seed.mjs silently dropped every one — 149 resources
      // reached production with no duration shown at all.
      if ('duration' in resource) {
        fail(`${file}: resource "${resource.id}" uses "duration" — the field is "length"; "duration" is never written to the database`);
      }
      if (!resource.url) {
        fail(`${file}: resource "${resource.id}" missing url`);
      } else {
        if (!allUrls.has(resource.url)) allUrls.set(resource.url, []);
        allUrls.get(resource.url).push(resource.id);

        const { isYouTubeHost, id } = deriveYouTube(resource.url);
        if (isYouTubeHost && !id && !/playlist|channel|\/@/.test(resource.url)) {
          warn(`${file}: resource "${resource.id}" looks like a YouTube URL but no video id could be derived: ${resource.url}`);
        }
      }
      resources.set(resource.id, { file });
    }

    // A topic with no resources can never complete: progress is derived from
    // resource completion, and sync_topic_progress returns early when a topic
    // has none. One empty topic silently caps its whole track below 100%, so
    // this is an error rather than a warning.
    const resourceCountByTopic = new Map();
    for (const resource of fileResources) {
      resourceCountByTopic.set(
        resource.topic_id,
        (resourceCountByTopic.get(resource.topic_id) ?? 0) + 1
      );
    }
    for (const topic of fileTopics) {
      if (!resourceCountByTopic.get(topic.id)) {
        fail(`${file}: topic "${topic.id}" (${topic.title}) has no resources — it could never be completed`);
      }
    }

    console.log(
      `  ${file}: ${filePhases.length} phases, ${fileTopics.length} topics, ${fileResources.length} resources`
    );
  }

  for (const [url, ids] of allUrls) {
    if (ids.length > 1) {
      warn(`duplicate URL across resources ${ids.join(', ')}: ${url}`);
    }
  }

  // Skills
  const skillsData = loadJson('skills.json');
  if (skillsData) {
    const skillIds = new Set();
    for (const skill of skillsData.skills ?? []) {
      if (skillIds.has(skill.id)) fail(`skills.json: duplicate skill id "${skill.id}"`);
      skillIds.add(skill.id);
      if (!skill.name) fail(`skills.json: skill "${skill.id}" missing name`);
      if (!skill.domain) fail(`skills.json: skill "${skill.id}" missing domain`);
    }
    for (const link of skillsData.skill_resources ?? []) {
      if (!skillIds.has(link.skill_id)) {
        fail(`skills.json: skill_resources references unknown skill_id "${link.skill_id}"`);
      }
      if (!resources.has(link.resource_id)) {
        fail(`skills.json: skill_resources references unknown resource_id "${link.resource_id}"`);
      }
    }
    console.log(
      `  skills.json: ${skillsData.skills?.length ?? 0} skills, ${skillsData.skill_resources?.length ?? 0} skill_resources links`
    );
  }

  // Cohorts
  const cohortsData = loadJson('cohorts.json');
  if (cohortsData) {
    const cohortIds = new Set();
    for (const cohort of cohortsData.cohorts ?? []) {
      if (cohortIds.has(cohort.id)) fail(`cohorts.json: duplicate cohort id "${cohort.id}"`);
      cohortIds.add(cohort.id);
      if (!cohort.label) fail(`cohorts.json: cohort "${cohort.id}" missing label`);
    }
    for (const link of cohortsData.cohort_courses ?? []) {
      if (!cohortIds.has(link.cohort_id)) {
        fail(`cohorts.json: cohort_courses references unknown cohort_id "${link.cohort_id}"`);
      }
      if (!tracks.has(link.track_id)) {
        fail(`cohorts.json: cohort_courses references unknown track_id "${link.track_id}"`);
      }
    }
    console.log(
      `  cohorts.json: ${cohortsData.cohorts?.length ?? 0} cohorts, ${cohortsData.cohort_courses?.length ?? 0} cohort_courses links`
    );
  }

  console.log(`\n${errors} error(s), ${warnings} warning(s).`);
  if (errors > 0) {
    console.error('Validation failed.');
    process.exit(1);
  }
  console.log('Validation passed.');
}

main();
