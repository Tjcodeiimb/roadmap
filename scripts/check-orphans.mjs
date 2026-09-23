#!/usr/bin/env node
/**
 * Reports where the database and the seed files disagree — in both directions.
 *
 * Two independent failure modes, because the seed script only ever upserts and
 * is only ever run by hand:
 *
 * 1. ORPHANS — a row removed from a seed JSON lingers in the database forever.
 *    That is how seven perfectly good Finance resources went missing from
 *    finance.json while still being served to learners; nobody noticed until a
 *    hand-written count came out seven too high.
 *
 * 2. DRIFT — a row edited in a seed JSON never reaches the database until
 *    someone re-seeds. This is the quieter and more dangerous one, because
 *    nothing looks wrong: the row exists, the page renders, and the learner
 *    clicks a link that was fixed weeks ago in git and is still dead in
 *    production. Repairing 87 rotted URLs in the seed files changed nothing
 *    for a single user until a migration carried them across.
 *
 * Read-only. It never writes anything: a difference can equally be content
 * edited through the admin panel, which is legitimate and must not be
 * clobbered. It tells you what to look at, and you decide — adopt it back into
 * the seed file, or carry it to the database with a migration.
 *
 *   node scripts/check-orphans.mjs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const seedDir = join(root, "scripts", "seed-data");

const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// id -> the seed row itself, so fields can be compared and not just presence.
const seed = { phases: new Map(), topics: new Map(), resources: new Map(), skills: new Map() };
const seedFileOf = new Map(); // id -> which seed file it came from
const seedTracks = new Set();
// Link tables have composite keys and no content of their own, so they can
// only be orphaned, never drift. They matter because seeding never deletes a
// link: a course dropped from a cohort, or a resource unmapped from a skill,
// stays live until a migration removes it.
const seedLinks = { cohort_courses: new Set(), skill_resources: new Set() };
for (const file of readdirSync(seedDir).filter((f) => f.endsWith(".json"))) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(seedDir, file), "utf8"));
  } catch {
    continue;
  }
  if (!data || typeof data !== "object") continue;
  for (const table of ["phases", "topics", "resources", "skills"]) {
    for (const row of data[table] ?? []) {
      if (!row?.id) continue;
      seed[table].set(row.id, row);
      seedFileOf.set(row.id, file);
    }
  }
  if (data.track?.id) seedTracks.add(data.track.id);
  for (const l of data.cohort_courses ?? []) seedLinks.cohort_courses.add(`${l.cohort_id}|${l.track_id}`);
  for (const l of data.skill_resources ?? []) seedLinks.skill_resources.add(`${l.skill_id}|${l.resource_id}`);
}

// Supabase caps a select at 1000 rows by default, and the catalogue is past
// that — page explicitly rather than silently reporting a truncated diff as a
// clean result.
async function fetchAll(table, columns) {
  const rows = [];
  const size = 1000;
  for (let from = 0; ; from += size) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + size - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < size) return rows;
  }
}

// A seed file may legitimately omit an optional field; the database then holds
// null. That is not drift. Drift is the seed file asserting a value the
// database does not have.
function normalize(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

let orphanCount = 0;
let driftCount = 0;
try {
for (const [table, cols, label, driftFields] of [
  ["phases", "id, title, track_id", (r) => `${r.id}  ${r.title}  (track ${r.track_id})`, ["title"]],
  ["topics", "id, title, phase_id", (r) => `${r.id}  ${r.title}  (phase ${r.phase_id})`, ["title"]],
  [
    "resources",
    "id, title, topic_id, url, length, note",
    (r) => `${r.id}  ${r.title}\n      ${r.url}`,
    // url is what rots; length is what the `duration`-vs-`length` mix-up
    // stranded for 149 rows; title and note are what a re-sourced link changes
    // alongside it.
    ["url", "title", "length", "note"],
  ],
  ["skills", "id, name", (r) => `${r.id}  ${r.name}`, ["name"]],
]) {
  const rows = await fetchAll(table, cols);
  const orphans = rows.filter((r) => !seed[table].has(r.id));
  console.log(`\n${table}: ${rows.length} in database, ${seed[table].size} in seed files`);

  if (!orphans.length) {
    console.log("  no orphans");
  } else {
    orphanCount += orphans.length;
    console.log(`  ${orphans.length} present in the database but NOT in any seed file:`);
    for (const r of orphans) console.log(`    - ${label(r)}`);
  }

  // Rows present on both sides whose fields no longer match.
  const drifted = [];
  for (const dbRow of rows) {
    const seedRow = seed[table].get(dbRow.id);
    if (!seedRow) continue;
    const diffs = driftFields
      .map((field) => ({ field, seed: normalize(seedRow[field]), db: normalize(dbRow[field]) }))
      // Only the seed asserting something the database lacks or contradicts.
      // The reverse is usually an admin-panel edit, which is legitimate.
      .filter((d) => d.seed !== null && d.seed !== d.db);
    if (diffs.length) drifted.push({ id: dbRow.id, diffs });
  }

  if (!drifted.length) {
    console.log("  no drift");
    continue;
  }
  driftCount += drifted.length;
  console.log(
    `  ${drifted.length} row(s) whose seed file and database disagree ` +
      `(the seed edit never reached the database):`
  );
  for (const { id, diffs } of drifted) {
    console.log(`    - ${id}  (${seedFileOf.get(id) ?? "?"})`);
    for (const d of diffs) {
      console.log(`        ${d.field}:`);
      console.log(`          seed: ${d.seed}`);
      console.log(`          db:   ${d.db ?? "(null)"}`);
    }
  }
}

const dbTracks = await fetchAll("tracks", "id, label");
const orphanTracks = dbTracks.filter((t) => !seedTracks.has(t.id));
console.log(`\ntracks: ${dbTracks.length} in database, ${seedTracks.size} in seed files`);
if (orphanTracks.length) {
  orphanCount += orphanTracks.length;
  console.log(`  ${orphanTracks.length} present in the database but NOT in any seed file:`);
  for (const t of orphanTracks) console.log(`    - ${t.id}  ${t.label}`);
} else {
  console.log("  no orphans");
}

for (const [table, a, b] of [
  ["cohort_courses", "cohort_id", "track_id"],
  ["skill_resources", "skill_id", "resource_id"],
]) {
  const rows = await fetchAll(table, `${a}, ${b}`);
  const orphans = rows.filter((r) => !seedLinks[table].has(`${r[a]}|${r[b]}`));
  const dbKeys = new Set(rows.map((r) => `${r[a]}|${r[b]}`));
  const missing = [...seedLinks[table]].filter((k) => !dbKeys.has(k));
  console.log(`\n${table}: ${rows.length} links in database, ${seedLinks[table].size} in seed files`);
  if (!orphans.length) console.log("  no orphaned links");
  else {
    orphanCount += orphans.length;
    console.log(`  ${orphans.length} link(s) in the database but NOT in the seed files:`);
    for (const r of orphans) console.log(`    - ${r[a]} -> ${r[b]}`);
  }
  if (!missing.length) console.log("  no missing links");
  else {
    driftCount += missing.length;
    console.log(`  ${missing.length} link(s) in the seed files but NOT in the database:`);
    for (const k of missing) console.log(`    - ${k.replace("|", " -> ")}`);
  }
}
} catch (err) {
  console.error(`\nCould not read the database: ${err.message}`);
  console.error("Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

console.log("");
if (orphanCount === 0 && driftCount === 0) {
  console.log("Database and seed files agree.");
} else {
  if (orphanCount > 0) {
    console.log(
      `${orphanCount} orphaned row(s) — each is either content to adopt back into the seed ` +
        `files, or something to delete with a migration. Decide per row; do not bulk-delete.`
    );
  }
  if (driftCount > 0) {
    console.log(
      `${driftCount} drifted row(s) — the seed files are ahead of the database. Learners are ` +
        `still being served the old values. Carry them across with a migration, or re-seed.`
    );
  }
}
