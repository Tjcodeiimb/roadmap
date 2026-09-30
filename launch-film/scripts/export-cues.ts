// Writes out/cues.json for the soundtrack from the acts' own timing constants (never retyped).
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, ACT_ORDER, BPM, CUE, FPS, TEAR, TOTAL, b } from '../src/timeline';
import { FRI, MON, OPEN, SAT, SUN, THU, THU_LEVEL_UP, TUE, WED } from '../src/acts';
import { XP } from '../src/data';
import { STRIP, TAB_W } from '../src/chrome';
import { E } from '../src/lib/anim';
import { roll } from '../src/lib/cam';

const abs = (act: keyof typeof ACT, f: number) => ACT[act].from + f;
const panX = (x: number) => Math.max(-0.8, Math.min(0.8, ((x - 540) / 540) * 0.7));
const tabPan = (i: number) => panX(STRIP.x + i * (TAB_W + STRIP.gap) + TAB_W / 2);

/** Frame of the largest per-frame step of an eased move: where its whoosh peaks. */
const velocityPeak = (from: number, to: number, ease: (t: number) => number) => {
  let best = from;
  let v = -1;
  for (let x = from; x < to; x++) {
    const d = ease((x + 1 - from) / (to - from)) - ease((x - from) / (to - from));
    if (d > v) {
      v = d;
      best = x;
    }
  }
  return best;
};

/** Frames where a rolling counter crosses a multiple of `step`, at least `gap` frames apart. */
const rollTicks = (act: keyof typeof ACT, from: number, to: number, a: number, z: number, step = 10, gap = 3) => {
  const out: number[] = [];
  let last = -99;
  let prev = Math.floor(a / step);
  for (let x = from; x <= to; x++) {
    const q = Math.floor(roll(x, from, to - from, a, z, E.ui) / step);
    if (q !== prev && x - last >= gap) {
      out.push(abs(act, x));
      last = x;
    }
    prev = q;
  }
  return out;
};

// [frame, pan, weight]
type Ev = [number, number, number];

const labels: Ev[] = [
  [abs('open', OPEN.label), -0.3, 1],
  [abs('mon', MON.label), -0.3, 1],
  [abs('tue', TUE.label), -0.3, 1],
  [abs('wed', WED.label), -0.3, 1],
  [abs('thu', THU.label), -0.3, 1],
  [abs('fri', FRI.label), -0.3, 1],
  [abs('sat', SAT.label), -0.3, 1],
  [abs('sun', SUN.line), 0, 1.2],
];
const smallStamps: Ev[] = [
  [abs('mon', MON.tag), -0.3, 0.6],
  [abs('thu', THU.xpIn), 0, 0.7],
  [abs('fri', FRI.xpChip), 0, 0.6],
  [abs('fri', FRI.tile), 0, 0.8],
  [abs('sat', SAT.picker), 0, 0.7],
  [abs('sun', SUN.xp), 0, 0.7],
  [abs('sun', SUN.tag), 0, 0.6],
];
const days: Ev[] = (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const).map((d, i) => [ACT[d].from, tabPan(i), 1]);
const tabs: Ev[] = OPEN.tabs.map((t, i) => [abs('open', t), tabPan(i), 0.7]);
// A page leaves fastest on its last frame (E.tear accelerates throughout): the rip peaks there.
const tears: Ev[] = ACT_ORDER.slice(0, -1).map((id, i) => [ACT[ACT_ORDER[i + 1]].from - 1, 0.2, 1]);
tears.push([abs('sun', SUN.outro) - 1, 0.2, 1.4]);
const taps: Ev[] = [
  [abs('mon', MON.tap), 0.5, 1],
  [abs('tue', TUE.tap1), 0, 0.8],
  [abs('tue', TUE.tap2), 0.1, 0.8],
  [abs('fri', FRI.tap), 0, 0.8],
  [abs('sat', SAT.tapChip), -0.4, 0.8],
  [abs('sat', SAT.tapAdd), 0.45, 1],
];
// Status flips (a row/card turning a new colour); weight 1 = completed, 0.6 = progress.
const flips: Ev[] = [
  [abs('tue', TUE.done1), 0, 1],
  [abs('tue', TUE.done2), 0, 1],
  ...WED.flips.map((x, i): Ev => [abs('wed', x), 0, i === 2 ? 1 : 0.6]),
  ...THU.tvm.map((x, i): Ev => [abs('thu', x), 0, i === 2 ? 1 : 0.6]),
  ...THU.npv.map((x): Ev => [abs('thu', x), 0, 0.6]),
];
const scrolls = [
  { from: abs('mon', MON.scroll[0]), to: abs('mon', MON.scroll[1]), peak: abs('mon', velocityPeak(MON.scroll[0], MON.scroll[1], E.scroll)), gain: 1 },
  { from: abs('thu', THU.scroll[0]), to: abs('thu', THU.scroll[1]), peak: abs('thu', velocityPeak(THU.scroll[0], THU.scroll[1], E.scroll)), gain: 0.6 },
  { from: abs('sun', SUN.strip[0]), to: abs('sun', SUN.strip[1]), peak: abs('sun', velocityPeak(SUN.strip[0], SUN.strip[1], E.scroll)), gain: 0.5 },
];

const cues = {
  fps: FPS,
  total: TOTAL,
  bpm: BPM,
  tear: TEAR,
  acts: ACT,
  cue: CUE,
  bars: { outro: b(23) },
  labels,
  smallStamps,
  days,
  tabs,
  tears,
  taps,
  flips,
  scrolls,
  toast: abs('mon', MON.toast),
  xpTicks: [
    ...rollTicks('thu', THU.roll[0], THU.roll[1], XP.wed, XP.thu),
    ...rollTicks('fri', FRI.roll[0], FRI.roll[1], XP.thu, XP.fri),
  ],
  levelUp: abs('thu', THU_LEVEL_UP),
  unlock: abs('fri', FRI.unlock),
  skillsCut: abs('fri', FRI.cut),
  satCut: abs('sat', SAT.cut),
  satLand: abs('sat', SAT.land),
  satFlat: abs('sat', SAT.flat),
  endTile: abs('sun', SUN.tile),
  endName: abs('sun', SUN.name),
};

mkdirSync('out', { recursive: true });
writeFileSync('out/cues.json', JSON.stringify(cues, null, 1));
console.log(`cues: ${labels.length} labels, ${tears.length} tears, ${taps.length} taps, ${flips.length} flips, ${cues.xpTicks.length} xp ticks`);
