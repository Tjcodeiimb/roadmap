#!/usr/bin/env node
/**
 * Rewrite a seed file in the house style, so editing content produces a diff
 * of the lines that changed rather than a reflow of the whole file.
 *
 * The style was established by hand across 29 track files and a plain
 * JSON.stringify(data, null, 2) does not reproduce it: `track` and `phases`
 * entries are pretty-printed, while `topics` and `resources` are one object
 * per line (a topic's `steps` inline with it). A topic is a paragraph of
 * prose plus a step list — on 18 lines each, a 40-topic track is unreadable
 * and unreviewable; on one line each, the file reads like a table.
 *
 *   node scripts/format-seed.mjs excel.json ...  # check these files
 *   node scripts/format-seed.mjs --write exc...  # rewrite them
 *   node scripts/format-seed.mjs                 # survey every seed file
 *
 * It exits non-zero only when you named the files, so it can gate a commit
 * on the files you touched. The survey is informational: the tracks authored
 * before this style settled (ai.json and friends) are still fully
 * pretty-printed, and reformatting them would be a diff of thousands of
 * lines with no content change in it.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "seed-data");

/** One line per object: `{ "k": v, ... }`, with nested objects closed up. */
function inlineObject(obj) {
  const parts = Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${compact(v)}`);
  return `{ ${parts.join(", ")} }`;
}

/** Nested values inside an inlined object get no padding inside the braces. */
function compact(v) {
  if (Array.isArray(v)) {
    // A step list reads as one dense block (`},{`); a tag list reads as prose
    // (`"excel", "basics"`). Both are the established style.
    const objects = v.some((x) => x && typeof x === "object");
    return `[${v.map(compact).join(objects ? "," : ", ")}]`;
  }
  if (v && typeof v === "object") {
    return `{${Object.entries(v)
      .map(([k, x]) => `${JSON.stringify(k)}: ${compact(x)}`)
      .join(", ")}}`;
  }
  return JSON.stringify(v);
}

/** Pretty-printed at `indent` spaces, the way JSON.stringify would nest it. */
function block(obj, indent) {
  return JSON.stringify(obj, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : " ".repeat(indent) + line))
    .join("\n");
}

const INLINE_KEYS = new Set(["topics", "resources"]);

export function formatSeed(data) {
  const keys = Object.keys(data);
  const body = keys.map((key) => {
    const value = data[key];
    if (Array.isArray(value)) {
      const render = INLINE_KEYS.has(key) ? inlineObject : (o) => block(o, 4);
      const items = value.map((item) => `    ${render(item)}`);
      return `  ${JSON.stringify(key)}: [\n${items.join(",\n")}\n  ]`;
    }
    return `  ${JSON.stringify(key)}: ${block(value, 2)}`;
  });
  return `{\n${body.join(",\n")}\n}\n`;
}

// Importable as a module (formatSeed) without running the CLI.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("format-seed.mjs");
if (!invokedDirectly) {
  // nothing to do on import
} else runCli();

function runCli() {
const args = process.argv.slice(2);
const write = args.includes("--write");
const named = args.filter((a) => !a.startsWith("--"));
const files = named.length ? named : readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).sort();

let offStyle = 0;
for (const file of files) {
  const path = join(DATA_DIR, file);
  const original = readFileSync(path, "utf8");
  const formatted = formatSeed(JSON.parse(original));
  if (original === formatted) continue;
  offStyle++;
  if (write) {
    writeFileSync(path, formatted);
    console.log(`rewrote ${file}`);
  } else {
    console.log(`off style: ${file}`);
  }
}

if (!offStyle) console.log(`${files.length} file(s) already in house style`);
else if (!write) {
  console.log(`\n${offStyle} of ${files.length} file(s) off style — run with --write to fix`);
  if (named.length) process.exit(1);
}
}
