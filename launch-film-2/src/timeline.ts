// Single source of truth for timing. The picture reads these; the soundtrack reads the exported JSON.
// "Close the tabs": 128 BPM, 16 bars = 30.0 s, vertical 1080x1920 at 60 fps, a laptop inside the frame.
export const FPS = 60;
export const BPM = 128;
export const W = 1080;
export const H = 1920;
export const BEAT = (FPS * 60) / BPM; // 28.125 frames

/** Absolute frame of bar (1-based), beat (0-3) and 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + (sub * BEAT) / 4);

const act = (fromBar: number, toBar: number) => ({ from: b(fromBar), dur: b(toBar) - b(fromBar) });

// Acts from the approved beat table (the end bar is exclusive).
export const ACT = {
  tabs: act(1, 4), // the problem: tabs and windows pile up
  snap: act(4, 5), // every window snaps shut; one app remains
  cohort: act(5, 8), // cohorts in detail
  road: act(8, 11), // the roadmap tracks itself
  resume: act(11, 15), // the resume builder in detail
  end: act(15, 17), // the window presses shut; end card
};
export type ActId = keyof typeof ACT;
export const ACT_ORDER: ActId[] = ['tabs', 'snap', 'cohort', 'road', 'resume', 'end'];

export const TOTAL = b(17); // 1800 frames = 30.0 s

export const CUE = {
  drop: b(4), // windows snap shut: the groove lands
  outro: b(15), // drums drop out, end card
};
