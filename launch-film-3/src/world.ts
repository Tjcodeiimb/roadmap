// The staircase world. Every step is a room in its own local coordinates (a 1920x1200 frame, or two
// side by side for the cohort room); room i sits RW[i-1] to the right of and SY above room i-1, so the
// next step's riser shows at the right edge of the frame. One camera keyframe list runs the whole film
// until the hard cut into the CTA.
import { ACT, at } from './timeline';
import { CamKey, camAt } from './lib/cam';
import { E } from './lib/anim';
import { C } from './theme';
import { SCREEN_ZOOM, LID } from './desktop';

/** Room widths (distance to the next riser). The cohort room is two frames wide: the camera walks it. */
export const RW = [1780, 3700, 1780, 1780, 1780, 1780];
export const SY = 540;
export const FLOOR = 1050; // local y of every step's walking surface
export const WALL_UP = 780; // walls extend this far above a room's frame (only seen in climbs and the overview)
export const STEPS = 6; // 0 = ground, 1..5 = cohort, course, skills, resume, level
export const PAGE2 = 1920; // local x of the cohort room's second frame

export const origin = (i: number) => ({ x: RW.slice(0, i).reduce((a, w) => a + w, 0), y: -i * SY });
export const toWorld = (i: number, x: number, y: number) => ({ x: origin(i).x + x, y: origin(i).y + y });
const rest = (i: number, dx = 0) => toWorld(i, 960 + dx, 600);

export const ROOM = [
  { wall: C.paper3, label: '00 GROUND', ink: C.ink },
  { wall: C.accentSoft, label: '01 COHORT', ink: C.ink },
  { wall: C.paper2, label: '02 COURSE', ink: C.ink },
  { wall: C.successSoft, label: '03 SKILLS', ink: C.ink },
  { wall: C.login, label: '04 RESUME', ink: C.ink },
  { wall: C.ink, label: '05 LEVEL UP', ink: C.paper },
];

// The laptop in the course room: its screen is authored at 1440x900 and shown at SCREEN_ZOOM inside
// the lid; the whole laptop is placed at LAPTOP.x/y (local) and scaled LAPTOP.s.
export const LAPTOP = { x: 560, y: 0, s: 0.9 };
LAPTOP.y = FLOOR - (900 * SCREEN_ZOOM + 2 * LID.bezel + 34) * LAPTOP.s;
/** Local room-2 point of a screen-px point. */
export const laptopPt = (sx: number, sy: number) => ({ x: LAPTOP.x + LAPTOP.s * (LID.bezel + sx * SCREEN_ZOOM), y: LAPTOP.y + LAPTOP.s * (LID.bezel + sy * SCREEN_ZOOM) });

// ---- the rise (turn act) ----------------------------------------------------------------------------
/** Blocks 1..5 lock into place on consecutive 8th notes from beat 1 of the turn. */
export const RISE = [1, 1.5, 2, 2.5, 3].map((k) => at('turn', k));

// ---- camera -----------------------------------------------------------------------------------------
// Overview: the whole staircase, ground to summit, in the lower part of the frame (the numbers sit above).
const SPAN = origin(5).x + 1920;
const OVER = { s: 1840 / SPAN, x: SPAN / 2, y: 0 };
OVER.y = (-5 * SY - WALL_UP + FLOOR + 200) / 2 - 150 / OVER.s;
const scr = laptopPt(720, 470);
export const PUSH = { at: at('course', 1.4), dur: 34, s: 1.9, target: toWorld(2, scr.x, scr.y) };
export const WALK = { from: at('cohort', 5.4), to: at('cohort', 6.4) };

export const CAM: CamKey[] = [
  { f: 0, s: 1, ...rest(0) },
  { f: ACT.turn.from - 4, s: 1.05, ...toWorld(0, 930, 620) },
  { f: at('turn', 0.6), s: 1.02, ...toWorld(0, 940, 620), ease: E.drift },
  { f: at('turn', 3.2), s: OVER.s, x: OVER.x, y: OVER.y, ease: E.climb },
  { f: at('turn', 5.6), s: OVER.s * 1.035, x: OVER.x, y: OVER.y },
  { f: ACT.cohort.from, s: 1, ...rest(1), ease: E.climb },
  { f: WALK.from, s: 1.02, ...rest(1, 20) },
  { f: WALK.to, s: 1, ...rest(1, PAGE2), ease: E.climb },
  { f: at('cohort', 11), s: 1.02, ...rest(1, PAGE2 + 10) },
  { f: ACT.course.from, s: 1, ...rest(2), ease: E.climb },
  { f: PUSH.at, s: 1, ...rest(2), ease: E.drift },
  { f: PUSH.at + PUSH.dur, s: PUSH.s, ...PUSH.target, ease: E.climb },
  { f: at('course', 4.8), s: PUSH.s * 1.02, ...PUSH.target },
  { f: ACT.skills.from, s: 1, ...rest(3), ease: E.climb },
  { f: at('skills', 4.8), s: 1.025, ...rest(3) },
  { f: ACT.resume.from, s: 1, ...rest(4), ease: E.climb },
  { f: at('resume', 8.8), s: 1.025, ...rest(4) },
  { f: ACT.level.from, s: 1, ...rest(5), ease: E.climb },
  { f: ACT.cta.from, s: 1.05, ...toWorld(5, 970, 600) },
];
export const camera = (F: number) => camAt(F, CAM);

/** Camera moves (absolute frames) for whooshes: [start, end]. */
const keyF = (f: number) => CAM.findIndex((k) => k.f === f);
export const CLIMBS: [number, number][] = [at('turn', 3.2), ACT.cohort.from, WALK.to, ACT.course.from, PUSH.at + PUSH.dur, ACT.skills.from, ACT.resume.from, ACT.level.from].map((f) => [CAM[keyF(f) - 1].f, f]);
