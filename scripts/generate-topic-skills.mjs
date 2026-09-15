// Additive, idempotent generator: one skill per topic across every active
// track, on top of the hand-curated "signature" skills already in
// skills.json. Run whenever new topics are added to seed-data/*.json.
//
// Design (see conversation/plan): granularity is per-TOPIC, not per-phase or
// per-resource — e.g. finance's "3-Statement Modeling" topic becomes its own
// skill, unlocked once every resource under that topic is done. Ids are
// namespaced `skill-topic-{topicId}` so they can never collide with the
// hand-authored `skill-{domain}-{name}` ids (topic ids are already globally
// unique, enforced by validate-seed.mjs).
//
// Edits skills.json via targeted string splices rather than a full
// JSON.stringify rewrite, so the diff is a pure append and the existing
// single-line-per-entry formatting survives untouched.
//
// Usage: node scripts/generate-topic-skills.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'seed-data');
const SKILLS_PATH = join(DATA_DIR, 'skills.json');

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
  // sustainability.json intentionally excluded - soft-hidden, not seeded.
];

// The 2 hand-authored "signature" skills per track use this domain value,
// which doesn't always match track.id (cybersecurity's signature skills use
// domain "security"). Generated skills must match so they group together
// under one heading on the Skills page instead of splitting into two.
const DOMAIN_OVERRIDE = {
  cybersecurity: 'security',
};

const XP_BY_TIER = { foundational: 60, intermediate: 90, advanced: 120 };

function loadJson(file) {
  return JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
}

function tierForPhase(orderIndex, phaseCount) {
  const third = Math.ceil(phaseCount / 3);
  if (orderIndex <= third) return 'foundational';
  if (orderIndex <= third * 2) return 'intermediate';
  return 'advanced';
}

function jsonStr(v) {
  return JSON.stringify(v);
}

function main() {
  const raw = readFileSync(SKILLS_PATH, 'utf8');
  const skillsData = JSON.parse(raw);
  const existingSkillIds = new Set(skillsData.skills.map((s) => s.id));

  const newSkillLines = [];
  const newLinkBlocks = [];

  for (const file of TRACK_FILES) {
    const { track, phases, topics, resources } = loadJson(file);
    const domain = DOMAIN_OVERRIDE[track.id] ?? track.id;
    const phaseOrder = new Map(phases.map((p) => [p.id, p.order_index]));
    const resourcesByTopic = new Map();
    for (const r of resources) {
      if (!resourcesByTopic.has(r.topic_id)) resourcesByTopic.set(r.topic_id, []);
      resourcesByTopic.get(r.topic_id).push(r);
    }

    for (const topic of topics) {
      const skillId = `skill-topic-${topic.id}`;
      const topicResources = resourcesByTopic.get(topic.id) ?? [];
      if (topicResources.length === 0) continue; // nothing to unlock it with
      if (existingSkillIds.has(skillId)) continue; // idempotent re-run

      const tier = tierForPhase(phaseOrder.get(topic.phase_id) ?? 1, phases.length);
      const description = topic.description || `Completed every resource in the "${topic.title}" topic.`;

      newSkillLines.push(
        `    { "id": ${jsonStr(skillId)}, "name": ${jsonStr(topic.title)}, "domain": ${jsonStr(domain)}, ` +
          `"description": ${jsonStr(description)}, "tier": ${jsonStr(tier)}, "icon_key": ${jsonStr(track.id)}, ` +
          `"xp_reward": ${XP_BY_TIER[tier]}, "threshold": 0 }`
      );
      existingSkillIds.add(skillId);

      const linkLines = topicResources.map(
        (r) => `    { "skill_id": ${jsonStr(skillId)}, "resource_id": ${jsonStr(r.id)} }`
      );
      newLinkBlocks.push(linkLines.join(',\n'));
    }
  }

  if (newSkillLines.length === 0) {
    console.log('No new topics to generate skills for — skills.json unchanged.');
    return;
  }

  const SKILLS_CLOSE = '\n  ],\n  "skill_resources": [\n';
  if (!raw.includes(SKILLS_CLOSE)) {
    throw new Error('Could not find the skills/skill_resources array boundary — skills.json format changed.');
  }
  let out = raw.replace(SKILLS_CLOSE, `,\n${newSkillLines.join(',\n')}${SKILLS_CLOSE}`);

  const LINKS_CLOSE = '\n  ]\n}\n';
  if (!out.endsWith(LINKS_CLOSE)) {
    throw new Error('Could not find the trailing skill_resources array close — skills.json format changed.');
  }
  out = out.slice(0, -LINKS_CLOSE.length) + `,\n\n${newLinkBlocks.join(',\n\n')}` + LINKS_CLOSE;

  writeFileSync(SKILLS_PATH, out, 'utf8');

  const newLinkCount = newLinkBlocks.reduce((sum, block) => sum + block.split('\n').length, 0);
  console.log(`Added ${newSkillLines.length} topic skills and ${newLinkCount} skill_resources links.`);
}

main();
