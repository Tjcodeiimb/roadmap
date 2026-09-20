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

  const dead = results.filter((r) => !r.ok && !r.blocked);
  const blocked = results.filter((r) => !r.ok && r.blocked);
  const okCount = results.length - dead.length - blocked.length;

  // Only the dead ones are printed per-line. Listing every success buried the
  // handful of real problems in hundreds of lines nobody read.
  if (dead.length) {
    console.log(`\nDEAD — the page is gone, replace these (${dead.length}):`);
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
    `\n${TRACK_FILES.length} track files, ${results.length} URLs: ` +
      `${okCount} OK, ${dead.length} dead, ${blocked.length} inconclusive.`
  );
  if (dead.length > 0) {
    console.error('\nReplace the dead URLs before seeding.');
    process.exit(1);
  }
}

main();
