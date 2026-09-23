// Additive, idempotent generator: one skill per topic across every seeded
// track, on top of the hand-curated "signature" skills already in
// skills.json. Run whenever topics or resources are added to seed-data/*.json.
//
// Granularity is per-TOPIC — e.g. finance's "3-Statement Modeling" topic is its
// own skill, unlocked once every resource mapped to it is done (threshold 0 =
// "all mapped resources"). Ids are namespaced `skill-topic-{topicId}` so they
// can never collide with the hand-authored `skill-{domain}-{name}` ids.
//
// It does two things, both additive:
//
// 1. Creates the skill for any topic that has resources but no skill yet.
// 2. Links every resource in a topic to that topic's skill. The first version
//    only did (1), so a resource added to an EXISTING topic was never mapped —
//    the skill then unlocked without it, and migration 0021 had to patch seven
//    Finance resources in by hand.
//
// It never removes a skill or a link. A topic that moves between tracks keeps
// its skill id, so learners keep what they earned.
//
// Usage: node scripts/generate-topic-skills.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TRACK_FILES } from './lib/track-files.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'seed-data');
const SKILLS_PATH = join(DATA_DIR, 'skills.json');

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

// Generated skills must share a domain with the track's hand-authored
// signature skills, or the Skills page splits one track across two headings.
// Those domains don't reliably equal track.domain (Negotiation's track says
// "business", its skills say "negotiation"), so read them off the existing
// skills first and fall back to track.domain, then track.id.
function domainFor(track, resourceIds, skillsData) {
  const signatureDomains = new Set();
  const byId = new Map(skillsData.skills.map((s) => [s.id, s]));
  for (const link of skillsData.skill_resources) {
    if (link.skill_id.startsWith('skill-topic-')) continue;
    if (!resourceIds.has(link.resource_id)) continue;
    const skill = byId.get(link.skill_id);
    if (skill) signatureDomains.add(skill.domain);
  }
  if (signatureDomains.size === 1) return [...signatureDomains][0];
  if (track.id === 'cybersecurity') return 'security';
  return track.domain ?? track.id;
}

function main() {
  const skillsData = JSON.parse(readFileSync(SKILLS_PATH, 'utf8'));
  const skillIds = new Set(skillsData.skills.map((s) => s.id));
  const linkKeys = new Set(skillsData.skill_resources.map((l) => `${l.skill_id}|${l.resource_id}`));

  let newSkills = 0;
  let newLinks = 0;
  const perTrack = [];

  for (const file of TRACK_FILES) {
    const { track, phases, topics, resources } = loadJson(file);
    const resourceIds = new Set(resources.map((r) => r.id));
    const domain = domainFor(track, resourceIds, skillsData);
    const phaseOrder = new Map(phases.map((p) => [p.id, p.order_index]));
    const resourcesByTopic = new Map();
    for (const r of resources) {
      if (!resourcesByTopic.has(r.topic_id)) resourcesByTopic.set(r.topic_id, []);
      resourcesByTopic.get(r.topic_id).push(r);
    }

    let trackSkills = 0;
    let trackLinks = 0;
    for (const topic of topics) {
      const topicResources = resourcesByTopic.get(topic.id) ?? [];
      if (topicResources.length === 0) continue; // nothing to unlock it with
      const skillId = `skill-topic-${topic.id}`;

      if (!skillIds.has(skillId)) {
        const tier = tierForPhase(phaseOrder.get(topic.phase_id) ?? 1, phases.length);
        skillsData.skills.push({
          id: skillId,
          name: topic.title,
          domain,
          description: topic.description || `Completed every resource in the "${topic.title}" topic.`,
          tier,
          icon_key: track.icon_key ?? track.id,
          xp_reward: XP_BY_TIER[tier],
          threshold: 0,
        });
        skillIds.add(skillId);
        trackSkills++;
      }

      for (const r of topicResources) {
        const key = `${skillId}|${r.id}`;
        if (linkKeys.has(key)) continue;
        skillsData.skill_resources.push({ skill_id: skillId, resource_id: r.id });
        linkKeys.add(key);
        trackLinks++;
      }
    }
    newSkills += trackSkills;
    newLinks += trackLinks;
    if (trackSkills || trackLinks) perTrack.push(`  ${track.id}: +${trackSkills} skills, +${trackLinks} links`);
  }

  if (newSkills === 0 && newLinks === 0) {
    console.log('Every topic already has its skill and every resource is linked — skills.json unchanged.');
    return;
  }

  writeFileSync(SKILLS_PATH, JSON.stringify(skillsData, null, 2) + '\n', 'utf8');
  console.log(perTrack.join('\n'));
  console.log(`Added ${newSkills} topic skills and ${newLinks} skill_resources links.`);
}

main();
