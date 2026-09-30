// Single source of truth for timing. The picture reads these; the soundtrack reads the exported JSON.
// "Tear-off week": 128 BPM, 24 bars = 45.0 s, vertical 1080x1920 at 60 fps.
export const FPS = 60;
export const BPM = 128;
export const W = 1080;
export const H = 1920;
export const BEAT = (FPS * 60) / BPM; // 28.125 frames

/** Absolute frame of bar (1-based), beat (0-3) and 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + (sub * BEAT) / 4);

const act = (fromBar: number, toBar: number) => ({ from: b(fromBar), dur: b(toBar) - b(fromBar) });

// Acts from the approved beat table (bars are 1-based; the end bar is exclusive).
export const ACT = {
  open: act(1, 3),
  mon: act(3, 6),
  tue: act(6, 8),
  wed: act(8, 10),
  thu: act(10, 15),
  fri: act(15, 19),
  sat: act(19, 22),
  sun: act(22, 25),
};
export type ActId = keyof typeof ACT;
export const ACT_ORDER: ActId[] = ['open', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const TOTAL = b(25); // 2700 frames = 45.0 s

// A page tear runs for this many frames and clears the frame exactly on the next act's downbeat.
export const TEAR = 14;

// Global cues the sound design locks to (absolute frames). Per-act cue lists come from the acts.
export const CUE = {
  hush: b(14, 3), // the near-silence beat before Friday
  drop: b(15), // Friday: the full groove returns
  outro: b(23), // drums drop out; the whole pad tears away to the end card
};
