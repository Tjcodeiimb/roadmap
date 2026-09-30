// Writes out/cues.json for film 2's soundtrack from the acts' own timing constants.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, BPM, CUE, FPS, TOTAL } from '../src/timeline';
import { COH, END, RES, ROAD, SNAP, TABS } from '../src/acts';

const abs = (a: keyof typeof ACT, f: number) => ACT[a].from + f;
const cues = {
  fps: FPS, total: TOTAL, bpm: BPM, acts: ACT, cue: CUE,
  windows: TABS.windows.map((f) => abs('tabs', f)),
  tabCount: [abs('tabs', TABS.count[0]), abs('tabs', TABS.count[1])],
  labels: [abs('tabs', TABS.label1), abs('tabs', TABS.label2), abs('snap', SNAP.label), abs('cohort', COH.label), abs('road', ROAD.label), abs('resume', RES.label), abs('end', END.line)],
  clicks: [abs('snap', SNAP.click), abs('cohort', COH.clickCard), abs('cohort', COH.enroll), abs('resume', RES.clickAdd), ...RES.chips.map((c) => abs('resume', c)), abs('resume', RES.confirm), abs('resume', RES.word)],
  cuts: [abs('cohort', COH.cut), ACT.road.from, ACT.resume.from],
  pops: [...COH.rows.map((f) => abs('cohort', f)), ...COH.nav.map((f) => abs('cohort', f)), ...RES.entries.map((f) => abs('resume', f))],
  flips: ROAD.flips.map((f) => abs('road', f)),
  unlocks: [ROAD.flips[0], ROAD.flips[3], ROAD.flips[7]].map((f) => abs('road', f)),
  toast: abs('cohort', COH.toast),
  open: abs('resume', RES.open),
  download: abs('resume', RES.download),
  zooms: [abs('cohort', COH.zoom[0]), abs('resume', RES.clickAdd - 20), abs('resume', RES.pan[0])],
  shutTabs: ACT.snap.from, shutRes: ACT.end.from,
  endTile: abs('end', END.tile), endName: abs('end', END.name), endTag: abs('end', END.tag),
};
mkdirSync('out', { recursive: true });
writeFileSync('out/cues.json', JSON.stringify(cues, null, 1));
console.log('cues written', cues.labels.length, cues.clicks.length);
