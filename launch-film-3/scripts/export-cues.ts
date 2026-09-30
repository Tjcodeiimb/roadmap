// Writes out/cues.json for "The Climb" v2's soundtrack from the acts' own timing constants.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, ACT_BEATS, BPM, CUE, FPS, TOTAL } from '../src/timeline';
import { CLIMBS, RISE } from '../src/world';
import { CLIMB_XP } from '../src/data';
import { COH, COURSE, CTA, GROUND, HEAP, LVL, PASSES, RES, SKL, STATS, STAT_STAGGER, TURN, xpAt } from '../src/acts';
import { WIPE_IN } from '../src/parts';

// A whoosh belongs on the velocity peak of its move: for the climb ease that sits ~45% into the window.
const peak = ([a, z]: [number, number]) => Math.round(a + 0.45 * (z - a));
const crossings: number[] = [];
for (const edge of [50, 150, 350]) {
  for (let f = LVL.roll[0]; f <= LVL.roll[1]; f++) if (xpAt(f) >= edge) { crossings.push(f); break; }
}
const title = (t: number) => [t, t + 19 + WIPE_IN];
const cues = {
  fps: FPS, total: TOTAL, bpm: BPM, acts: ACT, actBeats: ACT_BEATS, cue: CUE, xp: CLIMB_XP,
  lands: HEAP.map((p) => ({ f: p.land, x: (p.x - 960) / 960 })).filter((l) => l.f >= 0),
  lines: [...GROUND.lines.map((f) => f + WIPE_IN), TURN.enter + WIPE_IN],
  stamps: [GROUND.stamp, COH.stamp, RES.docx, LVL.stamp, CTA.tag],
  tile: TURN.tile,
  rises: RISE,
  stats: STATS.map((_, i) => TURN.stats + i * STAT_STAGGER),
  climbs: CLIMBS.map(peak),
  climbWin: CLIMBS,
  titles: [COH.title, COURSE.title, SKL.title, RES.title, LVL.title].flatMap(title),
  pass: COH.pass, fan: COH.fan, enroll: COH.enroll, stickers: [COH.s1, COH.s2, COH.s3], fill: COH.fill,
  ticks: COURSE.ticks,
  buzz: SKL.buzz, card: SKL.card, badges: SKL.badges,
  prints: RES.prints, chips: RES.chips, resCard: RES.card, tray: RES.tray,
  roll: LVL.roll, crossings, passes: PASSES.filter((f) => Number.isFinite(f)),
  ctaWant: CTA.want + WIPE_IN, keys: CTA.keys, send: CTA.send, seen: CTA.seen, ctaLine: CTA.line + WIPE_IN,
};
mkdirSync('out', { recursive: true });
writeFileSync('out/cues.json', JSON.stringify(cues, null, 1));
console.log('cues written', cues.total, cues.crossings, cues.passes);
