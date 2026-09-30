import { E, prog } from './anim';

type Ease = (t: number) => number;

// ---- camera keys -------------------------------------------------------------------------------
/** A camera pose: world point (x, y) held at the viewport centre, at scale s. `ease` shapes the move INTO this key. */
export type CamKey = { f: number; s: number; x: number; y: number; ease?: Ease };

/** Pose at frame f. Scale interpolates in log space (even-feeling zooms); moves may overlap by giving each its own window. */
export const camAt = (f: number, keys: CamKey[]) => {
  if (f <= keys[0].f) return { s: keys[0].s, x: keys[0].x, y: keys[0].y };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.f) {
      const k = prog(f, a.f, b.f, b.ease ?? E.drift);
      return { s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k), x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
  }
  const z = keys[keys.length - 1];
  return { s: z.s, x: z.x, y: z.y };
};

// ---- cursor ------------------------------------------------------------------------------------
/** Cursor stops: arrive at (x, y) on frame f; `click` presses there. Coordinates in whatever space the caller maps. */
export type CursorKey = { f: number; x: number; y: number; click?: boolean; lead?: number };

/** Cursor position and press (0..1) at frame f. It leaves each stop `lead` frames before the next arrival. */
export const cursorAt = (f: number, keys: CursorKey[]) => {
  let x = keys[0].x;
  let y = keys[0].y;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    const lead = b.lead ?? Math.min(18, Math.max(6, (b.f - a.f) * 0.8));
    const k = prog(f, b.f - lead, b.f, E.glide);
    if (f >= b.f - lead) {
      x = a.x + (b.x - a.x) * k;
      y = a.y + (b.y - a.y) * k;
    } else break;
  }
  let press = 0;
  for (const k of keys) if (k.click) press = Math.max(press, clickPress(f - k.f));
  return { x, y, press };
};

/** Press envelope around a click at t = 0: down over 3 frames, back up over 6. */
export const clickPress = (t: number) => (t < -3 || t > 6 ? 0 : t < 0 ? (t + 3) / 3 : 1 - t / 6);

/** Count up/down between figures, in whole units. */
export const roll = (f: number, start: number, dur: number, a: number, b: number, ease: Ease = E.ui) => Math.round(a + (b - a) * prog(f, start, start + dur, ease));
