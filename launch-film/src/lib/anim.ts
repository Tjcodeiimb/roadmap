import { Easing, interpolate, spring, SpringConfig } from 'remotion';

import { BEAT as TL_BEAT, FPS as TL_FPS } from '../timeline';

export const FPS = TL_FPS;
export const BEAT = TL_BEAT; // 28.125 frames at 128 BPM
export const BAR = BEAT * 4;
export const sec = (s: number) => Math.round(s * FPS);
export const beats = (b: number) => Math.round(b * BEAT);

// This film's easing set: mechanical and snappy, like the app's press interaction.
export const E = {
  stamp: Easing.bezier(0.9, 0, 1, 0.6), // a label slamming onto the page: accelerates all the way into contact
  tear: Easing.bezier(0.55, 0, 0.9, 0.35), // a page ripped off the pad: slow first inch, then gone
  scroll: Easing.bezier(0.3, 0, 0.1, 1), // camera scroll through a feed: quick start, long deceleration
  drift: Easing.bezier(0.45, 0, 0.55, 1), // slow pushes during holds
  ui: Easing.bezier(0.2, 0, 0, 1), // UI elements settling (toasts, fills, dialogs)
  glide: Easing.bezier(0.47, 0.2, 0.15, 1), // tap cursor travel
  linear: (t: number) => t,
};

type Ease = (t: number) => number;

/** Clamped tween between two frames. */
export const tw = (
  frame: number,
  from: number,
  to: number,
  a: number,
  b: number,
  ease: Ease = E.ui,
) =>
  interpolate(frame, [from, to], [a, b], {
    easing: ease,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 0..1 progress between two frames. */
export const prog = (frame: number, from: number, to: number, ease: Ease = E.ui) =>
  tw(frame, from, to, 0, 1, ease);

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;


/**
 * Attack-decay envelope for hits (ticks, pulses, punches): peaks `attack` frames after t = 0 so
 * the picture peaks with its sound, then decays exponentially. Starts and ends with ~zero slope
 * change, unlike a half-sine on a hard window.
 */
export const hitPulse = (t: number, attack = 2, tau = 5) =>
  t <= 0 || t > attack + 6 * tau ? 0 : t < attack ? Math.sin((t / attack) * (Math.PI / 2)) : Math.exp(-(t - attack) / tau);

export const SPR: Record<string, Partial<SpringConfig>> = {
  snap: { damping: 18, stiffness: 260, mass: 0.7 }, // locks into place w/ a small overshoot
  pop: { damping: 11, stiffness: 180, mass: 0.6 }, // playful overshoot
  soft: { damping: 26, stiffness: 120, mass: 1 }, // no overshoot, weighty
  heavy: { damping: 30, stiffness: 90, mass: 1.4 },
};

export const spr = (frame: number, start: number, cfg: Partial<SpringConfig> = SPR.snap, fps = FPS) =>
  spring({ frame: frame - start, fps, config: cfg });

/** Deterministic pseudo-random in [0,1) from an integer/string seed. */
export const rand = (seed: number | string) => {
  let h = typeof seed === 'number' ? seed * 2654435761 : 0;
  if (typeof seed === 'string') for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
