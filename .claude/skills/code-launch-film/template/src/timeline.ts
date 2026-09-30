// Single source of truth for timing. The picture reads these; the soundtrack reads the exported JSON.
// Choose FPS and BPM for THIS film (from the approved treatment). Frames per beat = FPS * 60 / BPM.
export const FPS = 60;
export const BPM = 120;
export const W = 1920;
export const H = 1080;
const BEAT = (FPS * 60) / BPM;

/** Absolute frame of bar (1-based), beat (0-3) and 16th (0-3). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + (sub * BEAT) / 4);

// Acts (absolute frames). Name and size them from the treatment's beat table.
export const ACT = {
  // open: { from: 0, dur: b(3) },
  // ...
} as Record<string, { from: number; dur: number }>;

export const TOTAL = b(9); // last bar + any hold for the audio tail

// Cues the sound design locks to (absolute frames).
export const CUE = {} as Record<string, number>;
