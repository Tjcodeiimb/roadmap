// Ported verbatim from the original tool's LEVELS constant.
export interface LevelDef {
  min: number;
  max: number;
  icon: string;
  name: string;
  label: string;
}

export const LEVELS: LevelDef[] = [
  { min: 0, max: 50, icon: "🌱", name: "Curious Mind", label: "Level 1" },
  { min: 50, max: 150, icon: "📚", name: "Active Learner", label: "Level 2" },
  { min: 150, max: 350, icon: "⚡", name: "Builder Mindset", label: "Level 3" },
  { min: 350, max: 700, icon: "🔥", name: "Flow State", label: "Level 4" },
  { min: 700, max: 1200, icon: "🚀", name: "Maker", label: "Level 5" },
  { min: 1200, max: 2000, icon: "💎", name: "AI Practitioner", label: "Level 6" },
  { min: 2000, max: 3500, icon: "🧠", name: "Deep Specialist", label: "Level 7" },
  { min: 3500, max: Infinity, icon: "👑", name: "AI Native", label: "Level 8" },
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
