#!/usr/bin/env node
/**
 * Reports rows that exist in the database but not in the seed files.
 *
 * The seed script only ever upserts, so anything removed from a seed JSON
 * lingers in the database indefinitely. That is how seven perfectly good
 * Finance resources went missing from finance.json while still being served to
 * learners — nobody noticed until a hand-written count came out seven too high.
 *
 * Read-only. It never deletes anything: an orphan can equally be content added
 * through the admin editor, which is legitimate and must not be discarded. It
 * tells you what to look at, and you decide.
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

const seedIds = { phases: new Set(), topics: new Set(), resources: new Set(), skills: new Set() };
for (const file of readdirSync(seedDir).filter((f) => f.endsWith(".json"))) {
  let data;
  try {
    data = JSON.parse(readFileSync(join(seedDir, file), "utf8"));
  } catch {
    continue;
  }
  if (!data || typeof data !== "object") continue;
  for (const p of data.phases ?? []) seedIds.phases.add(p.id);
  for (const t of data.topics ?? []) seedIds.topics.add(t.id);
  for (const r of data.resources ?? []) seedIds.resources.add(r.id);
  for (const s of data.skills ?? []) seedIds.skills.add(s.id);
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

let orphanCount = 0;
try {
for (const [table, cols, label] of [
  ["phases", "id, title, track_id", (r) => `${r.id}  ${r.title}  (track ${r.track_id})`],
  ["topics", "id, title, phase_id", (r) => `${r.id}  ${r.title}  (phase ${r.phase_id})`],
  ["resources", "id, title, topic_id, url", (r) => `${r.id}  ${r.title}\n      ${r.url}`],
  ["skills", "id, name", (r) => `${r.id}  ${r.name}`],
]) {
  const rows = await fetchAll(table, cols);
  const orphans = rows.filter((r) => !seedIds[table].has(r.id));
  console.log(`\n${table}: ${rows.length} in database, ${seedIds[table].size} in seed files`);
  if (!orphans.length) {
    console.log("  no orphans");
    continue;
  }
  orphanCount += orphans.length;
  console.log(`  ${orphans.length} present in the database but NOT in any seed file:`);
  for (const r of orphans) console.log(`    - ${label(r)}`);
}
} catch (err) {
  console.error(`\nCould not read the database: ${err.message}`);
  console.error("Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

console.log(
  orphanCount === 0
    ? "\nDatabase and seed files agree."
    : `\n${orphanCount} orphaned row(s). Each is either content to adopt back into the seed ` +
        `files, or something to delete with a migration — decide per row, and do not bulk-delete.`
);
