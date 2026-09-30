// "The Climb": one staircase world under one camera, then a hard cut to the CTA.
// Every timing constant below is exported so scripts/export-cues.ts can lock the soundtrack to it.
import { AbsoluteFill } from 'remotion';
import { Download } from 'lucide-react';
import { ACT, b } from './timeline';
import { E, hitPulse, mix, prog, rand, spr, SPR } from './lib/anim';
import { clickPress, roll } from './lib/cam';
import { C, F as FT, shadow } from './theme';
import { COHORT, FUND, CLIMB_SKILLS, XP_AFTER, CLIMB_XP } from './data';
import { AppShell, Browser, Laptop } from './desktop';
import { SkillUnlock, TopicRow, TierBadge, Status } from './ui';
import { camera, FLOOR, LAPTOP, origin, RISE, ROOM, STEPS, SX, SY, WALL_UP } from './world';
import {
  CHIP, DM, FanCard, Flag, Gauge, GAUGE_LEVELS, Headline, Junk, JunkCard, Mug, Notif, PassCard, Phone, PHONE, Plant,
  ResumeSheet, SkillBadge, SkillPickerMulti, StepTitle, Tile, Wipe, WIPE_IN,
} from './parts';

const rise = (i: number, F: number) => (i === 0 ? 1 : prog(F, RISE[i - 1] - 16, RISE[i - 1], E.fall));

// ---- GROUND: free resources pile up ---------------------------------------------------------------------
type Piece = { j: Junk; x: number; y: number; r: number; land: number };
const J = (kind: Junk['kind'], title: string, w: number, h: number, meta?: string): Junk => ({ kind, title, w, h, meta });
export const HEAP: Piece[] = [
  { j: J('video', 'Excel in 10 minutes (FULL COURSE)', 330, 220, '1:02:44'), x: 300, y: 808, r: -4, land: -40 },
  { j: J('list', 'Top 10 FREE courses (2026)', 270, 230), x: 580, y: 800, r: 5, land: 20 },
  { j: J('pdf', 'Finance_Notes_FINAL_v3.pdf', 210, 250), x: 820, y: 792, r: -6, land: 56 },
  { j: J('video', 'SQL for beginners, part 1 of 14', 330, 220, '48:10'), x: 1030, y: 808, r: 4, land: 75 },
  { j: J('folder', 'Watch later', 290, 190, '247 saved'), x: 400, y: 628, r: 7, land: 94 },
  { j: J('thread', 'What is a DCF? A thread', 290, 200, '1/23'), x: 690, y: 622, r: -8, land: 113 },
  { j: J('course', 'Free course: Intro to Analytics', 290, 210), x: 960, y: 640, r: 9, land: 131 },
  { j: J('video', 'Day 1 of learning Python', 330, 220, '12:03'), x: 520, y: 470, r: -9, land: 169 },
  { j: J('pdf', 'cheat-sheet (1).pdf', 210, 250), x: 810, y: 470, r: 11, land: 188 },
  { j: J('list', 'Resources to bookmark', 270, 230), x: 270, y: 470, r: -3, land: 206 },
  { j: J('progress', 'Excel course', 380, 124, 'last opened 43 days ago'), x: 640, y: 318, r: -3, land: 225 },
  { j: J('video', 'Case interview #7 (no audio?)', 330, 220, '31:22'), x: 960, y: 330, r: 6, land: 262 },
  { j: J('thread', 'Roadmap to learn finance', 290, 200, '1/41'), x: 370, y: 318, r: 10, land: 281 },
];
export const GROUND = { lines: [30, b(2), b(3)], stamp: b(3, 1) };
export const TURN = { tile: b(4), enter: b(4, 0, 2), fall: 24, scatter: 36 };
const TILE = { size: 240, x: 540 };
const FALL_DUR = 20;

const HeapPiece: React.FC<{ p: Piece; i: number; F: number }> = ({ p, i, F }) => {
  const start = p.land - FALL_DUR;
  if (F < start) return null;
  const k = prog(F, start, p.land, E.fall);
  let x = p.x;
  let y = mix(-300 - p.j.h, p.y, k);
  let r = mix(p.r - 30 * (rand(i) - 0.5), p.r, k);
  const land = F - p.land;
  const sq = land >= 0 ? hitPulse(land, 1, 4) : 0;
  // the tile's impact blows the heap apart
  const s = F - TURN.tile;
  if (s >= 0) {
    const dx = p.x - TILE.x;
    const dy = p.y - FLOOR - 200;
    const len = Math.hypot(dx, dy) || 1;
    const kk = prog(s, 0, TURN.scatter, E.throw);
    const dist = 1500 + 500 * rand(i + 40);
    x += (dx / len) * dist * kk;
    y += (dy / len) * dist * kk + 900 * kk * kk;
    r += (dx >= 0 ? 1 : -1) * (120 + 120 * rand(i + 9)) * kk;
    if (s > TURN.scatter) return null;
  }
  const isProg = p.j.kind === 'progress';
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x - p.j.w / 2}px, ${y - p.j.h / 2}px) rotate(${r}deg) scale(${1 + sq * 0.04}, ${1 - sq * 0.06})` }}>
      <JunkCard j={p.j} grey={isProg ? prog(F, GROUND.stamp - 30, GROUND.stamp, E.ui) : 0} stamp={isProg && F >= GROUND.stamp ? F - GROUND.stamp : -1} />
    </div>
  );
};

const GROUND_COPY = [['Free resources', 'are everywhere.'], ['No order.', 'No finish line.'], ['So most of us', 'never finish.']];

const GroundRoom: React.FC<{ F: number }> = ({ F }) => {
  const s = F - TURN.tile;
  const tileK = prog(F, TURN.tile - TURN.fall, TURN.tile, E.fall);
  const tileY = mix(-700, FLOOR - TILE.size, tileK);
  const squash = s >= 0 ? 0.14 * hitPulse(s, 1, 5) : 0;
  return (
    <>
      {HEAP.map((p, i) => <HeapPiece key={i} p={p} i={i} F={F} />)}
      {/* the problem, in three lines; the impact throws them off to the right */}
      <div style={{ position: 'absolute', left: 1210, top: 170, width: 560, transform: s >= 0 ? `translate(${1300 * prog(s, 0, 30, E.throw)}px, ${-120 * prog(s, 0, 30, E.throw)}px) rotate(${10 * prog(s, 0, 30, E.throw)}deg)` : undefined }}>
        {GROUND_COPY.map((l, i) => (
          <div key={i} style={{ marginBottom: 44 }}>
            <Wipe t={F - GROUND.lines[i]} bar={i === 2 ? C.accent : C.ink}>
              <Headline size={66} color={i === 2 ? C.accent : C.ink}>{l[0]}<br />{l[1]}</Headline>
            </Wipe>
          </div>
        ))}
      </div>
      {F >= TURN.tile - TURN.fall && (
        <div style={{ position: 'absolute', left: TILE.x - TILE.size / 2, top: 0, transform: `translate(0px, ${tileY}px)` }}>
          <Tile size={TILE.size} squash={squash} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 880, top: 300 }}>
        <Wipe t={F - TURN.enter} bar={C.accent}>
          <Headline size={150}>Enter</Headline>
        </Wipe>
        <div style={{ height: 6 }} />
        <Wipe t={F - TURN.enter - 5} bar={C.accent}>
          <Headline size={150} color={C.accent}>UpForge.</Headline>
        </Wipe>
      </div>
    </>
  );
};

// ---- STEP 1: cohort ---------------------------------------------------------------------------------------
export const COH = { title: b(6) - 6, sub: b(6, 2), pass: b(6), fan: [b(6, 2, 2), b(6, 3), b(6, 3, 2), b(7), b(7, 0, 2)], stamp: b(7, 2) };
const PASS = { x: 1250, y: 610 };
const FAN_A = [-30, -15, 0, 15, 30];

const CohortRoom: React.FC<{ F: number }> = ({ F }) => {
  const passK = Math.min(1, spr(F, COH.pass - 12, SPR.snap));
  const passY = mix(700, 0, passK);
  const stampT = F - COH.stamp;
  const punch = stampT >= 0 ? hitPulse(stampT + 1, 1, 5) : 0;
  return (
    <>
      <StepTitle n={1} t={F - COH.title} line="Pick a cohort." sub="5 courses · one path · 190 hours" subT={COH.sub - COH.title} x={110} y={170} />
      {COHORT.courses.map((c, i) => {
        const k = Math.min(1.08, spr(F, COH.fan[i] - 8, SPR.pop));
        if (F < COH.fan[i] - 8) return null;
        const a = (FAN_A[i] * Math.min(1, k) * Math.PI) / 180;
        const r = mix(300, 520, Math.min(1, k));
        const cx = PASS.x + r * Math.sin(a);
        const cy = 900 - r * Math.cos(a);
        return (
          <div key={c.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${cx - 115}px, ${cy - 150}px) rotate(${FAN_A[i] * k}deg)` }}>
            <FanCard n={i + 1} label={c.label} tier={c.tier} topics={c.topics} color={c.color} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: PASS.x - 310, top: PASS.y - 165, transform: `translate(0px, ${passY}px) scale(${1 + 0.03 * punch})` }}>
        <PassCard label={COHORT.label} hours={COHORT.hours} courses={COHORT.courses} stamp={stampT >= 0 ? stampT : -1} />
      </div>
    </>
  );
};

// ---- STEP 2: course roadmap on the laptop ------------------------------------------------------------------
export const COURSE = { title: b(8) - 8, ticks: [b(9), b(9, 0, 2), b(9, 1), b(9, 1, 2)] };

const CourseScreen: React.FC<{ F: number }> = ({ F }) => {
  const done = COURSE.ticks.filter((t) => F >= t).length;
  const xp = done === 0 ? 0 : XP_AFTER[done - 1];
  const status = (i: number): Status => (i < done ? 'done' : i === done ? 'active' : i === done + 1 ? 'next' : 'todo');
  return (
    <Browser tabs={['UpForge Learning']} path="/track/excel">
      <AppShell active={FUND.course} courses={COHORT.courses.map((c) => ({ label: c.label, color: c.color }))} xp={xp} streak={6}>
        <div style={{ zoom: 1.25, padding: '22px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em' }}>{FUND.course}</div>
            <TierBadge tier="foundational" />
            <div style={{ marginLeft: 'auto', borderRadius: 4, border: `2px solid ${C.ink}`, background: C.successSoft, color: C.success, padding: '4px 10px', fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{done} / {FUND.totalTopics} topics done</div>
          </div>
          <div style={{ margin: '18px 0 10px', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3 }}>{FUND.phase}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FUND.topics.map((t, i) => {
              const s = status(i);
              const pop = i < done ? hitPulse(F - COURSE.ticks[i], 1, 5) : 0;
              return <TopicRow key={t} title={t} status={s} done={s === 'done' ? FUND.perTopic : s === 'active' ? 1 : 0} total={FUND.perTopic} pop={pop} />;
            })}
          </div>
        </div>
      </AppShell>
    </Browser>
  );
};

const CourseRoom: React.FC<{ F: number }> = ({ F }) => (
  <>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${C.paper3} 3px, transparent 3.5px)`, backgroundSize: '44px 44px', top: -WALL_UP, height: FLOOR + WALL_UP }} />
    <StepTitle n={2} t={F - COURSE.title} line="Follow the roadmap." x={110} y={40} size={84} />
    <div style={{ position: 'absolute', left: 150, top: FLOOR - 260 }}><Plant sway={F} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${LAPTOP.x}px, ${LAPTOP.y}px) scale(${LAPTOP.s})`, transformOrigin: '0 0' }}>
      <Laptop>
        <CourseScreen F={F} />
      </Laptop>
    </div>
    <div style={{ position: 'absolute', left: 1480, top: FLOOR - 190 }}><Mug steam={F} /></div>
  </>
);

// ---- STEP 3: skills ----------------------------------------------------------------------------------------
export const SKL = { title: b(10, 0, 2), buzz: b(10, 1), card: b(10, 2), badges: [b(10, 3), b(11), b(11, 1), b(11, 2)] };
const PH = { x: 200, y: 96, rot: -4 };
const BADGE = { x: 920, y: 330, gap: 128 };
const FLY = 20;

const SkillsRoom: React.FC<{ F: number }> = ({ F }) => {
  const bz = F - SKL.buzz;
  const shake = bz >= 0 && bz < 24 ? Math.sin(bz * 2.2) * 7 * (1 - bz / 24) : 0;
  const bannerK = prog(F, SKL.buzz, SKL.buzz + 14, E.ui);
  const cardK = Math.min(1, spr(F, SKL.card - 6, SPR.pop));
  const phoneC = { x: PH.x + PHONE.w / 2, y: PH.y + PHONE.h * 0.5 };
  return (
    <>
      <StepTitle n={3} t={F - SKL.title} line="Earn real skills." x={BADGE.x} y={70} />
      <div style={{ position: 'absolute', left: PH.x, top: PH.y, transform: `rotate(${PH.rot + shake * 0.3}deg) translate(${shake}px, 0px)` }}>
        <Phone
          banner={bz >= 0 && (
            <div style={{ position: 'absolute', left: 12, right: 12, top: 56, transform: `translate(0px, ${(1 - bannerK) * -160}px)` }}>
              <Notif title="Skill unlocked" body={`${CLIMB_SKILLS[3]} · +60 XP`} />
            </div>
          )}
        >
          {F < SKL.card && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zoom: 1.08 }}>
              <div style={{ width: 300, fontFamily: FT.display, fontWeight: 900, fontSize: 22, color: C.ink }}>Continue learning</div>
              <div style={{ width: 300 }}><TopicRow title={CLIMB_SKILLS[3]} status="active" done={2} total={FUND.perTopic} /></div>
            </div>
          )}
          {F >= SKL.card - 6 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', transform: `scale(${0.82 * cardK})`, transformOrigin: '50% 40%' }}>
              <SkillUnlock name={CLIMB_SKILLS[3]} domain="excel" description="Turn a plain range into a real Excel Table so formatting, formulas and filters survive as data grows." xp={60} unlocked showXp />
            </div>
          )}
        </Phone>
      </div>
      {CLIMB_SKILLS.map((s, i) => {
        const land = SKL.badges[i];
        if (F < land - FLY + 6) return null;
        const k = prog(F, land - FLY + 6, land + 6, E.throw);
        const tx = BADGE.x;
        const ty = BADGE.y + i * BADGE.gap;
        const x = mix(phoneC.x - 320, tx, k);
        const y = mix(phoneC.y - 50, ty, k) - Math.sin(k * Math.PI) * 120;
        const sc = mix(0.3, 1, Math.min(1, k * 1.4));
        const pop = hitPulse(F - land, 1, 5);
        return (
          <div key={s} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${x}px, ${y}px) scale(${sc * (1 + 0.04 * pop)}) rotate(${(1 - k) * -12}deg)`, transformOrigin: '0 50%' }}>
            <SkillBadge name={s} />
          </div>
        );
      })}
    </>
  );
};

// ---- STEP 4: resume ----------------------------------------------------------------------------------------
export const RES = { title: b(12, 0, 2), picker: b(12, 0, 2), prints: [b(12, 1), b(12, 1, 2), b(12, 2), b(12, 2, 2)], confirm: b(12, 3), chips: [b(13), b(13, 0, 2), b(13, 1), b(13, 1, 2)], docx: b(13, 2) };
const PICK = { x: 110, y: 318 };
const SHEET = { x: 1080, top: 150, h: 760 };
const PRINT_STEP = (FLOOR - SHEET.top) / 4;
const chipFrom = (i: number) => ({ x: PICK.x + 30, y: PICK.y + 190 + i * 60 });
const chipTo = (i: number) => ({ x: SHEET.x + 38, y: SHEET.top + 505 + i * 27 });

const ResumeRoom: React.FC<{ F: number }> = ({ F }) => {
  const pickK = prog(F, RES.picker - 4, RES.picker + 16, E.ui);
  const printed = RES.prints.reduce((acc, p) => acc + PRINT_STEP * prog(F, p - 2, p + 12, E.ui), 0);
  const sheetTop = FLOOR - printed;
  const gone = CLIMB_SKILLS.map((_, i) => F >= RES.chips[i] - 14);
  const added = CLIMB_SKILLS.filter((_, i) => F >= RES.chips[i]);
  const flash = CLIMB_SKILLS.map((_, i) => (F >= RES.chips[i] ? 1 - prog(F, RES.chips[i] + 6, RES.chips[i] + 50, E.ui) * 0.65 : 0));
  return (
    <>
      <StepTitle n={4} t={F - RES.title} line="Build your resume." x={110} y={60} size={84} />
      {F >= RES.picker - 4 && <div style={{ position: 'absolute', left: PICK.x, top: PICK.y, transform: `translate(${(1 - pickK) * -900}px, 0px)` }}>
        <SkillPickerMulti skills={CLIMB_SKILLS} gone={gone} confirm={clickPress(F - RES.confirm)} />
      </div>}
      {/* the printer slot in the step, and the page it feeds out */}
      <div style={{ position: 'absolute', left: SHEET.x - 30, top: 0, width: 620, height: FLOOR, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 30, top: sheetTop }}>
          <ResumeSheet base={['Excel', 'PowerPoint', 'Stakeholder communication']} added={added} flash={flash} />
        </div>
      </div>
      {F >= RES.docx && (
        <div style={{ position: 'absolute', left: SHEET.x + 330, top: SHEET.top - 36, transform: `rotate(6deg) scale(${1 + 0.7 * (1 - prog(F - RES.docx, 0, 6, E.fall))})`, opacity: prog(F - RES.docx, 0, 3, E.linear), display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 20px', borderRadius: 10, border: `4px solid ${C.ink}`, background: C.accent, color: '#fff', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 26, boxShadow: shadow(6), whiteSpace: 'nowrap' }}>
          <Download size={26} strokeWidth={3} /> Export .docx
        </div>
      )}
      <div style={{ position: 'absolute', left: SHEET.x - 30, top: FLOOR - 8, width: 620, height: 16, background: C.ink, borderRadius: 8, border: `3px solid ${C.paper3}` }} />
      {CLIMB_SKILLS.map((s, i) => {
        const land = RES.chips[i];
        const t0 = land - 14;
        if (F < t0 || F >= land) return null;
        const k = prog(F, t0, land, E.fall);
        const a = chipFrom(i);
        const z = chipTo(i);
        return (
          <div key={s} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${mix(a.x, z.x, k)}px, ${mix(a.y, z.y, k) - Math.sin(k * Math.PI) * 160}px) scale(${mix(1, 0.7, k)})`, transformOrigin: '0 50%' }}>
            <span style={CHIP}>{s}</span>
          </div>
        );
      })}
    </>
  );
};
const F_DISPLAY = FT.display;

// ---- STEP 5: level up --------------------------------------------------------------------------------------
export const LVL = { title: b(14, 0, 2), roll: [b(14, 1), b(15)], stamp: b(15), flag: [b(15, 1), b(15, 2)] };
const EDGES = [0, 50, 150, 350, 700];
export const xpAt = (F: number) => roll(F, LVL.roll[0], LVL.roll[1] - LVL.roll[0], 0, CLIMB_XP, E.drift);
const posFor = (xp: number) => {
  for (let i = 0; i < 4; i++) if (xp < EDGES[i + 1]) return i + (xp - EDGES[i]) / (EDGES[i + 1] - EDGES[i]);
  return 4;
};
const GA = { cx: 1030, cy: 640, r: 360 };

const LevelRoom: React.FC<{ F: number }> = ({ F }) => {
  const xp = F >= LVL.roll[0] ? xpAt(F) : 0;
  const pos = posFor(xp);
  const lit = Math.floor(pos) + 1;
  const st = F - LVL.stamp;
  const lvlName = GAUGE_LEVELS[Math.min(3, Math.floor(pos))];
  const flagUp = prog(F, LVL.flag[0], LVL.flag[1], E.climb);
  return (
    <>
      <StepTitle n={5} t={F - LVL.title} line="Level up." x={110} y={80} dark bar={C.login} />
      <div style={{ position: 'absolute', left: GA.cx - GA.r, top: GA.cy - GA.r }}>
        <Gauge r={GA.r} pos={pos} lit={F >= LVL.roll[0] ? lit : 0} />
      </div>
      <div style={{ position: 'absolute', left: GA.cx - 300, width: 600, top: GA.cy + 44, textAlign: 'center', fontFamily: FT.mono, fontWeight: 700, fontSize: 70, color: C.paper, fontVariantNumeric: 'tabular-nums' }}>
        {xp} <span style={{ fontSize: 36, opacity: 0.7 }}>XP</span>
      </div>
      <div style={{ position: 'absolute', left: GA.cx - 400, width: 800, top: GA.cy + 142, display: 'flex', justifyContent: 'center' }}>
        {st < 0 ? (
          <div style={{ fontFamily: FT.display, fontWeight: 800, fontSize: 38, color: C.paper, opacity: F >= LVL.roll[0] ? 0.85 : 0 }}>{`Level ${lit} · ${lvlName}`}</div>
        ) : (
          <div style={{ transform: `rotate(-3deg) scale(${1 + 0.6 * (1 - prog(st, 0, 6, E.fall))})`, padding: '8px 22px', borderRadius: 10, border: `5px solid ${C.paper}`, background: C.login, color: C.ink, fontFamily: FT.display, fontWeight: 900, fontSize: 44, letterSpacing: '0.02em', boxShadow: shadow(6, C.accent), whiteSpace: 'nowrap' }}>
            LEVEL 4 · FLOW STATE
          </div>
        )}
      </div>
      {st >= 0 && st < 90 && Array.from({ length: 28 }, (_, i) => {
        const ang = (-165 + 150 * rand(i + 300)) * (Math.PI / 180);
        const v = 16 + 20 * rand(i + 400);
        const x = GA.cx + Math.cos(ang) * v * st;
        const y = GA.cy - 40 + Math.sin(ang) * v * st + 0.55 * st * st;
        const col = [C.login, C.accent, C.successSoft, C.paper, C.next][i % 5];
        const sz = 16 + 14 * rand(i + 500);
        return <div key={i} style={{ position: 'absolute', left: 0, top: 0, width: sz, height: sz * 0.7, background: col, border: `2px solid ${C.ink}`, transform: `translate(${x}px, ${y}px) rotate(${st * (8 + 10 * rand(i))}deg)` }} />;
      })}
      <div style={{ position: 'absolute', left: 1530, top: FLOOR - 520 }}><Flag up={flagUp} wave={F} /></div>
    </>
  );
};

// ---- the world ---------------------------------------------------------------------------------------------
const ROOMS = [GroundRoom, CohortRoom, CourseRoom, SkillsRoom, ResumeRoom, LevelRoom];

const Room: React.FC<{ i: number; F: number }> = ({ i, F }) => {
  const o = origin(i);
  const k = rise(i, F);
  const drop = i * SY * (1 - k);
  const land = i > 0 ? F - RISE[i - 1] : -1;
  const bump = land >= 0 ? -10 * hitPulse(land, 1, 4) : 0;
  const Content = ROOMS[i];
  const left = i === 0 ? -3000 : 0;
  const right = i === STEPS - 1 ? 3400 : i === 0 ? SX * 6 : SX;
  const room = ROOM[i];
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${o.x}px, ${o.y + drop + bump}px)` }}>
      <div style={{ position: 'absolute', left, top: -WALL_UP, width: right - left, height: FLOOR + WALL_UP, background: room.wall, opacity: i === 0 ? 1 : Math.min(1, k * 1.5) }}>
        <div style={{ position: 'absolute', left: -left + 90, top: 90, fontFamily: FT.display, fontWeight: 900, fontSize: 250, letterSpacing: '-0.04em', lineHeight: 1, color: room.ink, opacity: 0.12, whiteSpace: 'nowrap' }}>{room.label}</div>
      </div>
      {k >= 1 && <Content F={F} />}
      <div style={{ position: 'absolute', left, top: FLOOR, width: right - left, height: 6000, background: C.ink, borderTop: `10px solid ${i === STEPS - 1 ? C.login : C.paper}` }}>
        {i > 0 && <div style={{ position: 'absolute', left: 22, top: 18, opacity: k, fontFamily: FT.mono, fontWeight: 700, fontSize: 76, color: C.paper, letterSpacing: '-0.02em' }}>{String(i).padStart(2, '0')}</div>}
      </div>
    </div>
  );
};

export const World: React.FC<{ F: number }> = ({ F }) => {
  const cam = camera(F);
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(960px, 540px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {ROOMS.map((_, i) => <Room key={i} i={i} F={F} />)}
      </div>
    </AbsoluteFill>
  );
};

// ---- CTA ---------------------------------------------------------------------------------------------------
export const CTA = { want: b(16, 1), keys: [b(16, 2), b(16, 2, 2), b(16, 3), b(16, 3, 2)], send: b(17), seen: b(17, 0, 2) + 8, line: b(17, 2), tag: b(17, 3) };

export const Cta: React.FC<{ F: number }> = ({ F }) => {
  const f = F - ACT.cta.from;
  const push = 1 + 0.03 * prog(f, 0, ACT.cta.dur, E.drift);
  const punch = hitPulse(f + 1, 1, 6);
  const typed = 'BETA'.slice(0, CTA.keys.filter((k) => F >= k).length);
  const sent = F >= CTA.send;
  const caret = !sent && F >= CTA.want && Math.floor((F - CTA.want) / 19) % 2 === 0;
  const tagT = F - CTA.tag;
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push * (1 + 0.015 * punch)})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', left: 1010, top: -40, width: 1000, height: 1160, background: C.accent, borderLeft: `8px solid ${C.ink}` }} />
        <div style={{ position: 'absolute', left: 150, top: 120 }}><Tile size={170} /></div>
        <div style={{ position: 'absolute', left: 150, top: 340 }}><Headline size={92}>UpForge Learning</Headline></div>
        <div style={{ position: 'absolute', left: 150, top: 470 }}>
          <Wipe t={F - CTA.want} bar={C.ink}><Headline size={62} color={C.ink2}>Want in?</Headline></Wipe>
        </div>
        <div style={{ position: 'absolute', left: 150, top: 590, width: 820 }}>
          <Wipe t={F - CTA.line} bar={C.accent}><Headline size={84}>DM to enroll</Headline></Wipe>
          <Wipe t={F - CTA.line - 5} bar={C.accent}><Headline size={84} color={C.accent}>in the beta.</Headline></Wipe>
        </div>
        {tagT >= 0 && (
          <div style={{ position: 'absolute', left: 150, top: 830, transform: `rotate(-3deg) scale(${1 + 0.7 * (1 - prog(tagT, 0, 6, E.fall))})`, transformOrigin: '0 50%', opacity: prog(tagT, 0, 3, E.linear), display: 'inline-flex', alignItems: 'center', height: 70, padding: '0 26px', borderRadius: 10, border: `5px solid ${C.ink}`, background: C.login, fontFamily: FT.mono, fontWeight: 700, fontSize: 32, letterSpacing: '0.1em', color: C.ink, boxShadow: shadow(6) }}>
            INVITE ONLY
          </div>
        )}
        <div style={{ position: 'absolute', left: 1120, top: 150 }}>
          <DM typed={sent ? '' : typed} caret={caret} sent={sent ? F - CTA.send : -1} sendPress={clickPress(F - CTA.send)} seen={F >= CTA.seen ? F - CTA.seen : -1} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export { WIPE_IN, SX };
