// Single source of truth for timing. The picture reads these; the soundtrack reads the exported JSON.
// "The Climb" v2: 104 BPM, 78.5 beats = 45.3 s, 16:10 (fills a laptop screen) 1920x1200 at 60 fps.
export const FPS = 60;
export const BPM = 104;
export const W = 1920;
export const H = 1200;
export const BEAT = (FPS * 60) / BPM; // 34.615 frames

/** Absolute frame of bar (1-based), beat (0-3) and 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + (sub * BEAT) / 4);
/** Absolute frame of a beat count from the top (fractions allowed). */
export const bt = (beats: number) => Math.round(beats * BEAT);

const act = (fromBeat: number, toBeat: number) => ({ from: bt(fromBeat), dur: bt(toBeat) - bt(fromBeat) });

// Acts in beats from the top (the end beat is exclusive). 64 beats = 16 bars.
export const ACT_BEATS = { ground: 0, turn: 5, cohort: 18, course: 33, skills: 40.5, resume: 48, level: 59.5, cta: 69.5, end: 78.5 };
export const ACT = {
  ground: act(0, 5), // free resources pile up
  turn: act(5, 18), // the tile lands, the staircase rises, the numbers
  cohort: act(18, 33), // step 1: a cohort, then how cohorts work (app shot)
  course: act(33, 40.5), // step 2
  skills: act(40.5, 48), // step 3
  resume: act(48, 59.5), // step 4: IIM-format CV builder
  level: act(59.5, 69.5), // step 5: level up + leaderboard
  cta: act(69.5, 78.5), // DM to enroll
};
export type ActId = keyof typeof ACT;
export const ACT_ORDER: ActId[] = ['ground', 'turn', 'cohort', 'course', 'skills', 'resume', 'level', 'cta'];

/** Frame `beats` into act `id`. */
export const at = (id: ActId, beats: number) => bt(ACT_BEATS[id] + beats);

export const TOTAL = bt(78.5); // 2717 frames = 45.3 s

// The camera moves continuously through the staircase until the one hard cut into the CTA, so motion
// blur may only be kept from crossing that cut (src/blur.ts), not every act boundary.
export const SEGMENTS = [
  { from: 0, dur: ACT.cta.from },
  { from: ACT.cta.from, dur: TOTAL - ACT.cta.from },
];

export const CUE = {
  hush: at('turn', -0.5), // near-silence before the tile
  tile: ACT.turn.from, // the UpLearn tile lands; the groove starts
  hush2: at('level', -0.5), // near-silence before the summit
  summit: ACT.level.from,
  cut: ACT.cta.from, // hard cut to the CTA: drums out
};
