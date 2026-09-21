// Concurrent link sweep across every seed-data resource URL — this is what
// backs the "every URL verified" commitment. Run once per authoring batch,
// and again any time content is added.
//
// Usage: node scripts/check-links.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'seed-data');

// Discovered from the directory rather than hardcoded. The old fixed list had
// gone stale and covered only 9 of 25 tracks, so two thirds of the catalogue's
// links were never checked at all.
const TRACK_FILES = readdirSync(DATA_DIR)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => {
    try {
      const d = JSON.parse(readFileSync(join(DATA_DIR, f), 'utf8'));
      return d && typeof d === 'object' && Array.isArray(d.resources);
    } catch {
      return false;
    }
  })
  .sort();

// A transparent bot User-Agent got 403/500 from Cloudflare-fronted sites
// (every corporatefinanceinstitute.com URL, all of Salesforce) even though the
// pages are fine in a browser. That made the report mostly false alarms, which
// is worse than not running it.
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// 404/410 means the page is genuinely gone and the link must be replaced.
// 403/429/5xx almost always means bot protection here, not a dead link — worth
// reporting, but not worth failing a build over or hand-editing blindly.
function classify(status) {
  if (status >= 200 && status < 400) return { ok: true, blocked: false };
  if (status === 404 || status === 410) return { ok: false, blocked: false };
  return { ok: false, blocked: true };
}

const CONCURRENCY = 10;
const TIMEOUT_MS = 12000;

function loadTrack(file) {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
}

async function checkOne(resource) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(resource.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: BROWSER_HEADERS,
    });
    // Plenty of sites refuse HEAD, or serve bot-protection on it, but answer a
    // normal GET. Retry on anything that isn't a clean success or a hard 404.
    if (res.status === 405 || res.status === 501 || res.status === 403 || res.status >= 500) {
      res = await fetch(resource.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: BROWSER_HEADERS,
      });
    }
    return { resource, status: res.status, ...classify(res.status) };
  } catch (err) {
    // A network-level failure says nothing about whether the page exists.
    return { resource, status: null, ok: false, blocked: true, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let i = 0;
  async function next() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

async function main() {
  const allResources = [];
  for (const file of TRACK_FILES) {
    const data = loadTrack(file);
    for (const r of data.resources ?? []) allResources.push({ ...r, file });
  }

  console.log(`Checking ${allResources.length} resource URLs (concurrency ${CONCURRENCY})...`);
  const results = await runPool(allResources, checkOne, CONCURRENCY);

  function hostOf(u) {
    try {
      return new URL(u).host;
    } catch {
      return '(unparseable)';
    }
  }

  // Grouping by host is for DIAGNOSIS ONLY — it never downgrades a failure.
  //
  // An earlier version of this assumed that when every url on a host 404s the
  // host must be refusing bots, and excluded those from the failure count. A
  // browser check killed that theory: hbr.org really does 404 on all 25 of the
  // urls in our seed data. They were never real. A whole host failing usually
  // means the urls were fabricated in a batch, which is the most important
  // thing this tool can tell you — exactly what must not be hidden.
  const byHost = new Map();
  for (const r of results) {
    const h = hostOf(r.resource.url);
    if (!byHost.has(h)) byHost.set(h, { ok: 0, dead: [], blocked: [] });
    const e = byHost.get(h);
    if (r.ok) e.ok++;
    else if (r.blocked) e.blocked.push(r);
    else e.dead.push(r);
  }

  // Every dead link counts as dead. The split below only decides how it reads.
  const dead = [];      // host serves other pages fine -> an isolated rotted link
  const hostWide = [];  // every url on this host failed -> suspect a bad batch
  for (const [host, e] of byHost) {
    if (!e.dead.length) continue;
    if (e.ok === 0 && e.dead.length + e.blocked.length >= 3) hostWide.push([host, e.dead]);
    else dead.push(...e.dead);
  }

  const blocked = results.filter((r) => !r.ok && r.blocked);
  const hostWideCount = hostWide.reduce((n, [, rs]) => n + rs.length, 0);
  const okCount = results.filter((r) => r.ok).length;

  // Only the dead ones are printed per-line. Listing every success buried the
  // handful of real problems in hundreds of lines nobody read.
  if (hostWide.length) {
    console.log(
      `\nHOST-WIDE 404s — EVERY url on these hosts is dead (${hostWideCount}). ` +
        `These count as broken. A whole host failing at once usually means the ` +
        `urls were never real, so treat the entire group as suspect:`
    );
    for (const [host, rs] of hostWide.sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${host} (${rs.length}): ${rs.map((r) => r.resource.id).join(', ')}`);
    }
  }

  if (dead.length) {
    console.log(
      `\nDEAD — the host serves other pages fine, so these really are gone (${dead.length}):`
    );
    for (const r of dead) {
      console.log(`  ${r.status}  ${r.resource.file}  ${r.resource.id}\n       ${r.resource.url}`);
    }
  }

  if (blocked.length) {
    console.log(`\nINCONCLUSIVE — refused an automated request (${blocked.length}):`);
    console.log('  Usually bot protection rather than a dead link. Spot-check in a browser');
    console.log('  before changing anything; most of these are fine.');
    const byHost = new Map();
    for (const r of blocked) {
      let host;
      try {
        host = new URL(r.resource.url).host;
      } catch {
        host = '(unparseable)';
      }
      if (!byHost.has(host)) byHost.set(host, []);
      byHost.get(host).push(r);
    }
    for (const [host, rs] of [...byHost.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${host} (${rs.length}): ${rs.map((r) => `${r.resource.id} ${r.status ?? 'ERR'}`).join(', ')}`);
    }
  }

  console.log(
    `\n${TRACK_FILES.length} track files, ${results.length} URLs: ${okCount} OK, ` +
      `${dead.length + hostWideCount} dead (${hostWideCount} of them host-wide), ` +
      `${blocked.length} inconclusive.`
  );

  // Per-track totals: rot is rarely evenly spread, and a track where half the
  // links are dead needs re-sourcing wholesale rather than link by link.
  const perFile = new Map();
  for (const r of results) {
    const f = r.resource.file;
    if (!perFile.has(f)) perFile.set(f, { total: 0, bad: 0 });
    perFile.get(f).total++;
    if (!r.ok && !r.blocked) perFile.get(f).bad++;
  }
  const worst = [...perFile.entries()].filter(([, v]) => v.bad > 0)
    .sort((a, b) => b[1].bad / b[1].total - a[1].bad / a[1].total);
  if (worst.length) {
    console.log('\nDead links by track (worst first):');
    for (const [f, v] of worst) {
      console.log(`  ${String(Math.round((v.bad / v.total) * 100)).padStart(3)}%  ${String(v.bad).padStart(3)}/${String(v.total).padEnd(4)} ${f}`);
    }
  }

  if (dead.length + hostWideCount > 0) {
    console.error('\nReplace the dead URLs before seeding.');
    process.exit(1);
  }
}

main();
