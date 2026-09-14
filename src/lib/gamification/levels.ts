// Level bands ported from the original tool. Thresholds are mirrored by
// `xp_level()` in the SQL migration — change one and you must change both.
export interface LevelDef {
  level: number;
  min: number;
  max: number;
  name: string;
  label: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, min: 0, max: 50, name: "Curious Mind", label: "Level 1" },
  { level: 2, min: 50, max: 150, name: "Active Learner", label: "Level 2" },
  { level: 3, min: 150, max: 350, name: "Builder Mindset", label: "Level 3" },
  { level: 4, min: 350, max: 700, name: "Flow State", label: "Level 4" },
  { level: 5, min: 700, max: 1200, name: "Maker", label: "Level 5" },
  { level: 6, min: 1200, max: 2000, name: "Practitioner", label: "Level 6" },
  { level: 7, min: 2000, max: 3500, name: "Deep Specialist", label: "Level 7" },
  { level: 8, min: 3500, max: Infinity, name: "Polymath", label: "Level 8" },
];

export function levelForXP(xp: number): LevelDef {
  return LEVELS.find((l) => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1];
}

export function progressToNextLevel(xp: number) {
  const level = levelForXP(xp);
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  const pct = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100;
  return { level, next, pct: Math.min(100, Math.max(0, pct)) };
}

export const XP_PER_DONE_TOPIC = 50;
export const XP_PER_ACTIVE_TOPIC = 10;
