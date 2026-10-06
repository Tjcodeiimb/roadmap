#!/usr/bin/env node
/**
 * Fails if a query against a self-scoped table doesn't name its user.
 *
 * Relying on RLS to scope a read to the caller stopped being safe at
 * migration 0030, which added an "admin read" SELECT policy beside each
 * "own rows" policy. Postgres ORs permissive policies together, so for an
 * admin a select with no user filter returns EVERY learner's rows. That is
 * what made unenrolling look broken — the dashboard and sidebar were reading
 * other learners' active enrollments — and it silently applied to resumes,
 * skills, XP and projects too.
 *
 * The rule this enforces: every read of a self-scoped table filters on
 * user_id explicitly, either the caller's own id or a deliberate other-user
 * id (the admin learner page). Embedded selects count too, and are filtered
 * through their dotted path, e.g. .eq("phases.topics.user_progress.user_id", uid).
 *
 * Deliberately a lint, not a test: there is no test runner in this repo, and
 * the failure mode is a missing line rather than wrong logic, which greps
 * reliably.
 *
 *   node scripts/check-user-scoping.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

// Tables whose rows belong to one user. Each has an "own rows" policy, and
// most now also have an "admin read" policy (0030, and 0033 for projects).
const SELF_SCOPED = [
  "user_progress",
  "user_resource_progress",
  "user_track_selection",
  "user_skills",
  "user_cohort_enrollment",
  "user_xp",
  "user_streak",
  "user_projects",
  "user_project_stages",
  "resumes",
  "build_projects",
  "spaced_repetition",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (/\.tsx?$/.test(path)) out.push(path);
  }
  return out;
}

/**
 * A `.from("table")` call runs until the statement ends. Matching to the next
 * semicolon at the same nesting depth is enough here, because every call site
 * in this codebase is a single awaited expression or an element of a
 * Promise.all array — and a false "unscoped" verdict is cheap to see and fix,
 * whereas a false pass is the bug this exists to catch.
 */
function chainAfter(source, index) {
  const slice = source.slice(index);
  const end = slice.search(/;\s*\n/);
  return end === -1 ? slice.slice(0, 600) : slice.slice(0, end);
}

const problems = [];

for (const file of walk(SRC)) {
  const source = readFileSync(file, "utf8");
  const where = relative(ROOT, file);

  for (const table of SELF_SCOPED) {
    // Direct reads: .from("table") ... .select(...)
    const fromRe = new RegExp(`\\.from\\(\\s*["']${table}["']\\s*\\)`, "g");
    let m;
    while ((m = fromRe.exec(source)) !== null) {
      const chain = chainAfter(source, m.index);
      if (!/\.(select|update|delete|upsert)\(/.test(chain)) continue;
      // An upsert/insert carries user_id in its payload instead of a filter.
      if (/\.(upsert|insert)\(/.test(chain) && /user_id/.test(chain)) continue;
      if (/\.eq\(\s*["']user_id["']/.test(chain)) continue;
      const line = source.slice(0, m.index).split("\n").length;
      problems.push(`${where}:${line} — .from("${table}") with no .eq("user_id", …)`);
    }

    // Embedded reads: table(...) inside another select, filtered by path.
    const embedRe = new RegExp(`["'\`][^"'\`]*[\\s,(]${table}(!\\w+)?\\(`, "g");
    while ((m = embedRe.exec(source)) !== null) {
      const stmtStart = source.lastIndexOf("await", m.index);
      const chain = chainAfter(source, stmtStart === -1 ? m.index : stmtStart);
      if (new RegExp(`\\.eq\\(\\s*["'][\\w.]*${table}\\.user_id["']`).test(chain)) continue;
      // The admin learner page reads a named other user, by the same path rule.
      if (new RegExp(`\\.eq\\(\\s*["'][\\w.]*${table}\\.user_id["']`).test(chain)) continue;
      const line = source.slice(0, m.index).split("\n").length;
      problems.push(`${where}:${line} — embedded ${table}(…) with no .eq("…${table}.user_id", …)`);
    }
  }
}

if (problems.length) {
  console.error("Unscoped reads of self-scoped tables:\n");
  for (const p of problems) console.error("  " + p);
  console.error(
    `\n${problems.length} problem(s). Every read of a self-scoped table must filter on user_id —\n` +
      "RLS alone lets an admin read every learner's rows (migration 0030)."
  );
  process.exit(1);
}

console.log(`No unscoped reads. Checked ${SELF_SCOPED.length} self-scoped tables across src/.`);
