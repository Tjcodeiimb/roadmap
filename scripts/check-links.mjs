// Concurrent link sweep across every seed-data resource URL — this is what
// backs the "every URL verified" commitment. Run once per authoring batch,
// and again any time content is added.
//
// Usage: node scripts/check-links.mjs

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
];

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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; link-check/1.0)' },
    });
    // Some sites (rightly) don't support HEAD — fall back to GET.
    if (res.status === 405 || res.status === 501) {
      res = await fetch(resource.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; link-check/1.0)' },
      });
    }
    return { resource, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return { resource, status: null, ok: false, error: err.message };
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

  const broken = results.filter((r) => !r.ok);
  for (const r of results) {
    const label = r.ok ? 'OK  ' : 'FAIL';
    console.log(`${label} ${r.status ?? 'ERR'}  ${r.resource.file}  ${r.resource.id}  ${r.resource.url}${r.error ? `  (${r.error})` : ''}`);
  }

  console.log(`\n${results.length - broken.length}/${results.length} OK, ${broken.length} broken.`);
  if (broken.length > 0) {
    console.error('Some URLs failed — fix or replace them before seeding.');
    process.exit(1);
  }
}

main();
