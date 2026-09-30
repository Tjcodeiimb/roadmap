// Demo data. Course, topic, resource and skill names/figures are REAL (from the app's
// scripts/seed-data). Meera, her resume, and her week of progress are FICTIONAL.
import { C, TRACK } from './theme';

export type Course = {
  id: string;
  label: string;
  tier: 'foundational' | 'intermediate' | 'advanced';
  summary: string;
  hours: number;
  effort: string;
  topics: number;
  color: string;
  iconKey?: string; // tracks.icon_key from the seed; the app falls back to the track id, then LinkMark
};

const ICON_KEY: Record<string, string> = { negotiation: 'consulting', 'excel-finance': 'excel' };
const course = (c: Omit<Course, 'color' | 'iconKey'>): Course => ({ ...c, color: TRACK[c.id] ?? C.accent, iconKey: ICON_KEY[c.id] });

// The marketplace feed Monday scrolls through, in the order it scrolls. The scroll lands on Excel for
// Finance, with more courses still below it.
export const FEED: Course[] = [
  course({ id: 'marketing', label: 'Growth & Marketing', tier: 'foundational', summary: 'Teaches how to attract, convert, and retain customers using a full-funnel toolkit.', hours: 55, effort: '3-5 hrs', topics: 17 }),
  course({ id: 'psychology', label: 'Behavioral Psychology', tier: 'foundational', summary: 'Learn how people actually decide and behave — heuristics, biases, motivation, and habit formation.', hours: 45, effort: '3-5 hrs', topics: 18 }),
  course({ id: 'data', label: 'Data & Analytics', tier: 'intermediate', summary: 'Turn raw, messy data into clear answers and visuals that drive real decisions.', hours: 82, effort: '4-6 hrs', topics: 19 }),
  course({ id: 'sales', label: 'B2B Sales', tier: 'foundational', summary: 'The core playbook of B2B sales — prospecting, discovery, objection handling, closing.', hours: 50, effort: '3-5 hrs', topics: 17 }),
  course({ id: 'prompt-eng', label: 'Prompt Engineering & AI Tools', tier: 'intermediate', summary: 'Master the art and science of writing effective prompts for ChatGPT, Claude, and AI coding tools.', hours: 20, effort: '3–5 hrs', topics: 18 }),
  course({ id: 'negotiation', label: 'Negotiation & Deal-Making', tier: 'intermediate', summary: 'BATNA, tactical empathy, salary conversations, vendor contracts and cross-cultural dynamics.', hours: 18, effort: '3-4 hrs', topics: 18 }),
  course({ id: 'excel-finance', label: 'Excel for Finance', tier: 'advanced', summary: 'The Excel craft behind real financial work, from financial functions and model structure to three-statement, DCF and LBO builds.', hours: 85, effort: '5-7 hrs', topics: 35 }),
  course({ id: 'people', label: 'People & Org Design', tier: 'intermediate', summary: 'The hiring, feedback, performance, and structure skills every people leader actually uses.', hours: 55, effort: '3-5 hrs', topics: 18 }),
  course({ id: 'ux', label: 'UX & Discovery', tier: 'foundational', summary: 'Go from a blank whiteboard to a tested prototype.', hours: 55, effort: '3-5 hrs', topics: 18 }),
];
export const PICK = FEED.find((c) => c.id === 'excel-finance')!;
export const PUBLISHED_COURSES = 29; // 30 seeded tracks; ESG is hidden from the marketplace (migration 0007)

export type Resource = { title: string; meta: string; action: 'Watch' | 'Read' };
export type Topic = { title: string; resources: Resource[] };

// Excel for Finance, phases 1-2, exactly as seeded.
export const PHASES: { title: string; topics: Topic[] }[] = [
  {
    title: 'Excel Foundations for Finance',
    topics: [
      {
        title: 'Keyboard-Only Navigation & Shortcuts',
        resources: [
          { title: 'Excel Shortcuts for Investment Banking: Quick Tips', meta: 'Breaking Into Wall Street · video · 10 min', action: 'Watch' },
          { title: 'Excel Shortcuts Cheat Sheet (Printable PDF)', meta: 'Wall Street Prep · pdf · ~10 min read', action: 'Read' },
        ],
      },
      {
        title: 'Excel Options & Number Formats for Model Setup',
        resources: [
          { title: 'Freeze Panes to Lock Rows and Columns', meta: 'Microsoft Support · article · 5 min', action: 'Read' },
          { title: 'Change Formula Recalculation, Iteration, or Precision in Excel', meta: 'Microsoft Support · article · 5 min', action: 'Read' },
          { title: 'Excel Custom Number Formats', meta: 'ExcelJet · article · ~10 min read', action: 'Read' },
        ],
      },
    ],
  },
  {
    title: 'Financial Functions for Analysts',
    topics: [
      { title: 'Time Value of Money Functions', resources: [0, 0, 0].map(() => ({ title: '', meta: '', action: 'Read' as const })) },
      { title: 'NPV, IRR, XIRR & MIRR', resources: [0, 0, 0, 0].map(() => ({ title: '', meta: '', action: 'Read' as const })) },
      { title: 'Depreciation & Date Functions for Models', resources: [0, 0, 0, 0, 0].map(() => ({ title: '', meta: '', action: 'Read' as const })) },
    ],
  },
];
export const TOTAL_TOPICS = 35;

// Per-topic skills, each worth 60 XP (skills.json). Friday's unlock is the fourth of the week.
export const SKILL = {
  name: 'NPV, IRR, XIRR & MIRR',
  domain: 'excel',
  description: 'Discount a stream of cash flows and find its rate of return — and know when regular NPV/IRR are wrong.',
  xp: 60,
};
export const WEEK_SKILLS = [
  'Keyboard-Only Navigation & Shortcuts',
  'Excel Options & Number Formats for Model Setup',
  'Time Value of Money Functions',
  'NPV, IRR, XIRR & MIRR',
];

// XP by the app's own rules (recompute_xp): +10 per resource done, +10 for an active topic,
// +50 for a done topic, + each unlocked skill's xp_reward (60 here). Levels from levels.ts.
//   Tue  keyboard topic: 2 res + done + skill           = 20 + 50 + 60        -> 130
//   Wed  options topic:  3 res + done + skill           = 30 + 50 + 60        -> 270
//   Thu  TVM topic:      3 res + done + skill           = 30 + 50 + 60        -> 410
//        NPV topic:      3 of 4 res + active            = 30 + 10             -> 450
//   Fri  NPV topic:      4th res + active->done + skill = 10 + 40 + 60        -> 560
export const XP = { mon: 0, tue: 130, wed: 270, thuTvm: 410, thu: 450, friPre: 500, fri: 560 };
export const LEVELS = [
  { min: 0, max: 50, name: 'Curious Mind', label: 'Level 1' },
  { min: 50, max: 150, name: 'Active Learner', label: 'Level 2' },
  { min: 150, max: 350, name: 'Builder Mindset', label: 'Level 3' },
  { min: 350, max: 700, name: 'Flow State', label: 'Level 4' },
  { min: 700, max: 1200, name: 'Maker', label: 'Level 5' },
];
export const levelFor = (xp: number) => LEVELS.find((l) => xp >= l.min && xp < l.max) ?? LEVELS[LEVELS.length - 1];

// Streak: she opens the app every day Mon-Sat (touch_streak runs on every visit), rests Sunday.
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Fictional resume.
export const RESUME = {
  name: 'Meera Iyer',
  contact: '+91 98XXX XXXXX  |  meera.iyer@example.com  |  linkedin.com/in/meera-iyer',
  roles: [
    { org: 'UpForge Consulting', title: 'Business Analyst', when: '2024 – Present', bullets: ['Built weekly KPI dashboards for 3 client engagements', 'Cut month-end reporting time by 30% with templated models'] },
  ],
  education: [{ degree: 'B.Com (Hons)', institute: 'University of Delhi', grade: '8.4', year: '2024' }],
  skills: ['Excel', 'PowerPoint', 'SQL (basic)', 'Stakeholder communication'],
};
