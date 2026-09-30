// The staircase world. Every step is a 1920x1080 "room" in its own local coordinates; room i sits
// SX to the right of and SY above room i-1, so the next step's riser shows at the right edge of the
// frame. The camera is one keyframe list across the whole film (until the hard cut into the CTA).
import { ACT, b } from './timeline';
import { CamKey, camAt } from './lib/cam';
import { E } from './lib/anim';
import { C } from './theme';
import { SCREEN_ZOOM, LID } from './desktop';

export const SX = 1780;
export const SY = 520;
export const FLOOR = 920; // local y of every step's walking surface
export const WALL_UP = 780; // walls extend this far above a room's frame (only seen in climbs and the overview)
export const STEPS = 6; // 0 = ground, 1..5 = cohort, course, skills, resume, level

export const origin = (i: number) => ({ x: i * SX, y: -i * SY });
export const toWorld = (i: number, x: number, y: number) => ({ x: i * SX + x, y: -i * SY + y });
const rest = (i: number) => toWorld(i, 960, 540);

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
export const LAPTOP = { x: 535, y: 0, s: 0.85 };
LAPTOP.y = FLOOR - (900 * SCREEN_ZOOM + 2 * LID.bezel + 34) * LAPTOP.s;
/** Local room-2 point of a screen-px point. */
export const laptopPt = (sx: number, sy: number) => ({ x: LAPTOP.x + LAPTOP.s * (LID.bezel + sx * SCREEN_ZOOM), y: LAPTOP.y + LAPTOP.s * (LID.bezel + sy * SCREEN_ZOOM) });

// ---- the rise (turn act) ----------------------------------------------------------------------------
/** Blocks 1..5 extrude on consecutive 8th notes from bar 4 beat 2. */
export const RISE = [1, 2, 3, 4, 5].map((i) => b(4, 2) + Math.round(((i - 1) * 37.5) / 2));

// ---- camera -----------------------------------------------------------------------------------------
// Overview: the whole staircase, ground to summit, fitted to the frame.
const OVER = { x: (5 * SX + 1920) / 2 - 60, y: (-5 * SY + 1080) / 2 - 330, s: 0.172 };
const climbIn = (i: number, at: number): CamKey[] => [{ f: at, s: 1, ...rest(i), ease: E.climb }];
const CLIMB = 46; // frames: a step-to-step climb lands on the room's downbeat
const scr = laptopPt(720, 470);
export const PUSH = { at: b(8, 2) - 6, dur: 50, s: 2.05, target: toWorld(2, scr.x, scr.y) };

export const CAM: CamKey[] = [
  { f: 0, s: 1, ...rest(0) },
  { f: b(4) - 6, s: 1.045, ...toWorld(0, 930, 560) },
  // the tile lands; hold a beat, then pull out as the steps rise
  { f: b(4, 1) + 12, s: 1.02, ...toWorld(0, 940, 560), ease: E.drift },
  { f: b(5, 0, 2), s: OVER.s, x: OVER.x, y: OVER.y, ease: E.climb },
  { f: b(5, 2), s: OVER.s * 1.04, x: OVER.x, y: OVER.y - 20 },
  ...climbIn(1, ACT.cohort.from),
  { f: ACT.course.from - CLIMB, s: 1.03, ...rest(1) },
  ...climbIn(2, ACT.course.from),
  { f: PUSH.at, s: 1, ...rest(2), ease: E.drift },
  { f: PUSH.at + PUSH.dur, s: PUSH.s, ...PUSH.target, ease: E.climb },
  { f: ACT.skills.from - CLIMB - 4, s: PUSH.s * 1.03, ...PUSH.target },
  ...climbIn(3, ACT.skills.from),
  { f: ACT.resume.from - CLIMB, s: 1.03, ...rest(3) },
  ...climbIn(4, ACT.resume.from),
  { f: ACT.level.from - CLIMB, s: 1.03, ...rest(4) },
  ...climbIn(5, ACT.level.from),
  { f: ACT.cta.from, s: 1.07, ...toWorld(5, 990, 560) },
];
export const camera = (F: number) => camAt(F, CAM);

/** Climb windows (absolute frames) for whooshes: [start, end]. */
export const CLIMBS: [number, number][] = [
  [b(4, 1) + 12, b(5, 0, 2)],
  [b(5, 2), ACT.cohort.from],
  [ACT.course.from - CLIMB, ACT.course.from],
  [PUSH.at, PUSH.at + PUSH.dur],
  [ACT.skills.from - CLIMB - 4, ACT.skills.from],
  [ACT.resume.from - CLIMB, ACT.resume.from],
  [ACT.level.from - CLIMB, ACT.level.from],
];
