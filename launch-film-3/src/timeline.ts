// Single source of truth for timing. The picture reads these; the soundtrack reads the exported JSON.
// "The Climb": 96 BPM, 18 bars = 45.0 s, landscape 1920x1080 at 60 fps.
export const FPS = 60;
export const BPM = 96;
export const W = 1920;
export const H = 1080;
export const BEAT = (FPS * 60) / BPM; // 37.5 frames

/** Absolute frame of bar (1-based), beat (0-3) and 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + (sub * BEAT) / 4);

const act = (fromBar: number, toBar: number) => ({ from: b(fromBar), dur: b(toBar) - b(fromBar) });

// Acts from the approved beat table (bars are 1-based; the end bar is exclusive).
export const ACT = {
  ground: act(1, 4), // free resources pile up
  turn: act(4, 6), // the UF tile lands, the staircase rises
  cohort: act(6, 8), // step 1
  course: act(8, 10), // step 2
  skills: act(10, 12), // step 3
  resume: act(12, 14), // step 4
  level: act(14, 16), // step 5
  cta: act(16, 19), // DM to enroll
};
export type ActId = keyof typeof ACT;
export const ACT_ORDER: ActId[] = ['ground', 'turn', 'cohort', 'course', 'skills', 'resume', 'level', 'cta'];

export const TOTAL = b(19); // 2700 frames = 45.0 s

// The camera moves continuously through the staircase until the one hard cut into the CTA, so motion
// blur may only be kept from crossing that cut (src/blur.ts), not every act boundary.
export const SEGMENTS = [
  { from: 0, dur: ACT.cta.from },
  { from: ACT.cta.from, dur: TOTAL - ACT.cta.from },
];

export const CUE = {
  hush: b(3, 3), // near-silence before the tile
  tile: b(4), // the UF tile lands; the groove starts
  hush2: b(13, 3), // near-silence before the summit
  summit: b(14), // level up: peak
  cut: b(16), // hard cut to the CTA: drums out
};
