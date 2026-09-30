// "The Climb" v2: one staircase world under one camera, then a hard cut to the CTA.
// Every timing constant below is exported so scripts/export-cues.ts can lock the soundtrack to it.
import { AbsoluteFill } from 'remotion';
import { Download } from 'lucide-react';
import { ACT, at } from './timeline';
import { E, hitPulse, mix, prog, rand, spr, SPR } from './lib/anim';
import { clickPress, roll } from './lib/cam';
import { C, F as FT, shadow } from './theme';
import { COHORT, FUND, CLIMB_SKILLS, XP_AFTER, CLIMB_XP } from './data';
import { AppShell, Browser, Laptop } from './desktop';
import { SkillUnlock, TopicRow, TierBadge, Status } from './ui';
import { camera, FLOOR, LAPTOP, origin, PAGE2, RISE, ROOM, RW, STEPS, SY, WALL_UP } from './world';
import {
  CHIP, CohortPage, DM, FanCard, Gauge, GAUGE_LEVELS, Headline, IIMSheet, Junk, JunkCard, LB_ROW, LeaderRow, Mug, Notif, PassCard, Phone, PHONE, Plant,
  SkillBadge, Stat, StatsBar, StepTitle, Sticker, TemplateCard, IIM_SECTIONS, Tile, Wipe, WIPE_IN,
} from './parts';

const rise = (i: number, F: number) => (i === 0 ? 1 : prog(F, RISE[i - 1] - 14, RISE[i - 1], E.fall));

// ---- GROUND: free resources pile up (fast) ---------------------------------------------------------------
type Piece = { j: Junk; x: number; y: number; r: number; land: number };
const J = (kind: Junk['kind'], title: string, w: number, h: number, meta?: string): Junk => ({ kind, title, w, h, meta });
const s16 = (k: number) => at('ground', k / 4);
const DY = 130; // the heap sits on this film's lower floor
export const HEAP: Piece[] = [
  { j: J('video', 'Excel in 10 minutes (FULL COURSE)', 330, 220, '1:02:44'), x: 300, y: 808 + DY, r: -4, land: -60 },
  { j: J('list', 'Top 10 FREE courses (2026)', 270, 230), x: 580, y: 800 + DY, r: 5, land: -40 },
  { j: J('pdf', 'Finance_Notes_FINAL_v3.pdf', 210, 250), x: 820, y: 792 + DY, r: -6, land: -30 },
  { j: J('video', 'SQL for beginners, part 1 of 14', 330, 220, '48:10'), x: 1030, y: 808 + DY, r: 4, land: -20 },
  { j: J('folder', 'Watch later', 290, 190, '247 saved'), x: 400, y: 628 + DY, r: 7, land: s16(3) },
  { j: J('thread', 'What is a DCF? A thread', 290, 200, '1/23'), x: 690, y: 622 + DY, r: -8, land: s16(4) },
  { j: J('course', 'Free course: Intro to Analytics', 290, 210), x: 960, y: 640 + DY, r: 9, land: s16(5) },
  { j: J('video', 'Day 1 of learning Python', 330, 220, '12:03'), x: 520, y: 470 + DY, r: -9, land: s16(6) },
  { j: J('progress', 'Excel course', 380, 124, 'last opened 43 days ago'), x: 640, y: 318 + DY, r: -3, land: s16(8) },
  { j: J('pdf', 'cheat-sheet (1).pdf', 210, 250), x: 810, y: 470 + DY, r: 11, land: s16(7) },
  { j: J('list', 'Resources to bookmark', 270, 230), x: 270, y: 470 + DY, r: -3, land: s16(9) },
  { j: J('video', 'Case interview #7 (no audio?)', 330, 220, '31:22'), x: 960, y: 330 + DY, r: 6, land: s16(10) },
  { j: J('thread', 'Roadmap to learn finance', 290, 200, '1/41'), x: 370, y: 318 + DY, r: 10, land: s16(11) },
];
export const GROUND = { lines: [at('ground', 0.25), at('ground', 1.5), at('ground', 3)], stamp: at('ground', 3.5) };
export const TURN = { tile: ACT.turn.from, enter: at('turn', 0.5), fall: 20, scatter: 34, stats: at('turn', 5), statsOut: at('turn', 10.6) };
const TILE = { size: 240, x: 540 };
const FALL_DUR = 16;
export const STATS: Stat[] = [
  { value: 1662, label: 'free resources' },
  { value: 1800, suffix: '+', label: 'hours of content' },
  { value: 450, label: 'sources, one place' },
  { value: 29, label: 'courses · 10 cohorts' },
];
export const STAT_STAGGER = 14;

const HeapPiece: React.FC<{ p: Piece; i: number; F: number }> = ({ p, i, F }) => {
  const start = p.land - FALL_DUR;
  if (F < start) return null;
  const k = prog(F, start, p.land, E.fall);
  let x = p.x;
  let y = mix(-300 - p.j.h, p.y, k);
  let r = mix(p.r - 30 * (rand(i) - 0.5), p.r, k);
  const land = F - p.land;
  const sq = land >= 0 ? hitPulse(land, 1, 4) : 0;
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
      <JunkCard j={p.j} grey={isProg ? prog(F, GROUND.stamp - 20, GROUND.stamp, E.ui) : 0} stamp={isProg && F >= GROUND.stamp ? F - GROUND.stamp : -1} />
    </div>
  );
};

const GROUND_COPY = [['Free resources', 'are everywhere.'], ['No order.', 'No finish line.'], ['So most of us', 'never finish.']];

const GroundRoom: React.FC<{ F: number }> = ({ F }) => {
  const s = F - TURN.tile;
  const tileK = prog(F, TURN.tile - TURN.fall, TURN.tile, E.fall);
  const tileY = mix(-700, FLOOR - TILE.size, tileK);
  const squash = s >= 0 ? 0.14 * hitPulse(s, 1, 5) : 0;
  const out = s >= 0 ? prog(s, 0, 30, E.throw) : 0;
  return (
    <>
      {HEAP.map((p, i) => <HeapPiece key={i} p={p} i={i} F={F} />)}
      <div style={{ position: 'absolute', left: 1210, top: 250, width: 560, transform: `translate(${1300 * out}px, ${-120 * out}px) rotate(${10 * out}deg)` }}>
        {GROUND_COPY.map((l, i) => (
          <div key={i} style={{ marginBottom: 48 }}>
            <Wipe t={F - GROUND.lines[i]} bar={i === 2 ? C.accent : C.ink}>
              <Headline size={68} color={i === 2 ? C.accent : C.ink}>{l[0]}<br />{l[1]}</Headline>
            </Wipe>
          </div>
        ))}
      </div>
      {F >= TURN.tile - TURN.fall && (
        <div style={{ position: 'absolute', left: TILE.x - TILE.size / 2, top: 0, transform: `translate(0px, ${tileY}px)` }}>
          <Tile size={TILE.size} squash={squash} />
        </div>
      )}
      <div style={{ position: 'absolute', left: 860, top: 400 }}>
        <Wipe t={F - TURN.enter} bar={C.accent}><Headline size={150}>Enter</Headline></Wipe>
        <div style={{ height: 6 }} />
        <Wipe t={F - TURN.enter - 5} bar={C.accent}><Headline size={150} color={C.accent}>UpLearn.</Headline></Wipe>
      </div>
    </>
  );
};

// ---- STEP 1: cohort, then how cohorts work ------------------------------------------------------------------
export const COH = {
  title: at('cohort', -0.5), pass: at('cohort', -0.4), sub: at('cohort', 1.5),
  fan: [2, 2.5, 3, 3.5, 4].map((k) => at('cohort', k)), stamp: at('cohort', 4.75),
  enroll: at('cohort', 7.8), s1: at('cohort', 8), s2: at('cohort', 9), row: at('cohort', 9), s3: at('cohort', 10), fill: [10.3, 10.6, 10.9, 11.2, 11.5].map((k) => at('cohort', k)),
};
const PASS = { x: 1250, y: 700 };
const FAN_A = [-30, -15, 0, 15, 30];

const CohortRoom: React.FC<{ F: number }> = ({ F }) => {
  const passK = Math.min(1, spr(F, COH.pass - 12, SPR.snap));
  const stampT = F - COH.stamp;
  const punch = stampT >= 0 ? hitPulse(stampT + 1, 1, 5) : 0;
  const filled = COH.fill.filter((f) => F >= f).length;
  return (
    <>
      <StepTitle n={1} t={F - COH.title} line="Pick a cohort." sub="5 courses · 190 hours · one enrolment" subT={COH.sub - COH.title} x={110} y={230} />
      {COHORT.courses.map((c, i) => {
        if (F < COH.fan[i] - 8) return null;
        const k = Math.min(1.08, spr(F, COH.fan[i] - 8, SPR.pop));
        const a = (FAN_A[i] * Math.min(1, k) * Math.PI) / 180;
        const r = mix(300, 520, Math.min(1, k));
        const cx = PASS.x + r * Math.sin(a);
        const cy = 1000 - r * Math.cos(a);
        return (
          <div key={c.id} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${cx - 115}px, ${cy - 150}px) rotate(${FAN_A[i] * k}deg)` }}>
            <FanCard n={i + 1} label={c.label} tier={c.tier} topics={c.topics} color={c.color} />
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: PASS.x - 310, top: PASS.y - 165, transform: `translate(0px, ${mix(700, 0, passK)}px) scale(${1 + 0.03 * punch})` }}>
        <PassCard label={COHORT.label} hours={COHORT.hours} courses={COHORT.courses} stamp={stampT >= 0 ? stampT : -1} />
      </div>
      {/* page 2: the app's cohort page, annotated */}
      <Browser tabs={['UpLearn']} path="/marketplace/cohort/new-analyst-bootcamp" x={PAGE2 + 90} y={130} w={1040} h={890}>
        <div style={{ zoom: 1.16 }}><CohortPage label={COHORT.label} hours={COHORT.hours} summary={COHORT.summary} courses={COHORT.courses} enrollPress={clickPress(F - COH.enroll)} enrolled={F >= COH.enroll} rowIdx={3} rowPop={F >= COH.row ? hitPulse(F - COH.row, 1, 6) + 0.001 : 0} rowEnroll={F >= COH.row ? F - COH.row : -1} /></div>
      </Browser>
      <div style={{ position: 'absolute', left: PAGE2 + 1190, top: 170 }}>
        <Sticker t={F - COH.s1} rot={-3} width={560}>1 enrolment →<br />all 5 courses</Sticker>
      </div>
      <div style={{ position: 'absolute', left: PAGE2 + 1210, top: 440 }}>
        <Sticker t={F - COH.s2} rot={2} bg={C.paper2} width={540}>Or take any course<br />on its own</Sticker>
      </div>
      <div style={{ position: 'absolute', left: PAGE2 + 1190, top: 710 }}>
        <Sticker t={F - COH.s3} rot={-2} bg={C.successSoft} width={560}>
          Finish all 5 →<br />cohort complete
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {COHORT.courses.map((c, i) => (
              <span key={c.id} style={{ flex: 1, height: 26, borderRadius: 4, border: `3px solid ${C.ink}`, background: i < filled ? C.success : C.paper2, transform: `scale(${1 + 0.15 * hitPulse(F - COH.fill[i], 1, 4)})` }} />
            ))}
          </div>
        </Sticker>
      </div>
    </>
  );
};

// ---- STEP 2: course roadmap on the laptop ------------------------------------------------------------------
export const COURSE = { title: at('course', -0.25), ticks: [2.5, 3, 3.5, 4].map((k) => at('course', k)) };

const CourseScreen: React.FC<{ F: number }> = ({ F }) => {
  const done = COURSE.ticks.filter((t) => F >= t).length;
  const xp = done === 0 ? 0 : XP_AFTER[done - 1];
  const status = (i: number): Status => (i < done ? 'done' : i === done ? 'active' : i === done + 1 ? 'next' : 'todo');
  return (
    <Browser tabs={['UpLearn']} path="/track/excel">
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
    <div style={{ position: 'absolute', left: 0, width: RW[2], backgroundImage: `radial-gradient(${C.paper3} 3px, transparent 3.5px)`, backgroundSize: '44px 44px', top: -WALL_UP, height: FLOOR + WALL_UP }} />
    <StepTitle n={2} t={F - COURSE.title} line="Follow the roadmap." x={110} y={60} size={84} />
    <div style={{ position: 'absolute', left: 160, top: FLOOR - 260 }}><Plant sway={F} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${LAPTOP.x}px, ${LAPTOP.y}px) scale(${LAPTOP.s})`, transformOrigin: '0 0' }}>
      <Laptop>
        <CourseScreen F={F} />
      </Laptop>
    </div>
    <div style={{ position: 'absolute', left: 1530, top: FLOOR - 190 }}><Mug steam={F} /></div>
  </>
);

// ---- STEP 3: skills ----------------------------------------------------------------------------------------
export const SKL = { title: at('skills', 0), buzz: at('skills', 0.5), card: at('skills', 1), badges: [2, 2.5, 3, 3.5].map((k) => at('skills', k)) };
const PH = { x: 200, y: 180, rot: -4 };
const BADGE = { x: 920, y: 400, gap: 128 };
const FLY = 18;

const SkillsRoom: React.FC<{ F: number }> = ({ F }) => {
  const bz = F - SKL.buzz;
  const shake = bz >= 0 && bz < 22 ? Math.sin(bz * 2.2) * 7 * (1 - bz / 22) : 0;
  const bannerK = prog(F, SKL.buzz, SKL.buzz + 12, E.ui);
  const cardK = Math.min(1, spr(F, SKL.card - 6, SPR.pop));
  const phoneC = { x: PH.x + PHONE.w / 2, y: PH.y + PHONE.h * 0.5 };
  return (
    <>
      <StepTitle n={3} t={F - SKL.title} line="Earn real skills." x={BADGE.x} y={130} />
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
        const x = mix(phoneC.x - 320, BADGE.x, k);
        const y = mix(phoneC.y - 50, BADGE.y + i * BADGE.gap, k) - Math.sin(k * Math.PI) * 120;
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

// ---- STEP 4: IIM-format CV builder --------------------------------------------------------------------------
export const RES = {
  title: at('resume', 0), sub: at('resume', 1.2), card: at('resume', 0.4), prints: [1, 1.5, 2, 2.5, 3].map((k) => at('resume', k)),
  tray: at('resume', 3.5), chips: [4.5, 5, 5.5, 6].map((k) => at('resume', k)), docx: at('resume', 7.5),
};
const TPL = { x: 110, y: 330 };
const TRAY = { x: 110, y: 700 };
const SHEET = { x: 1080, top: 150 };
const PRINT_STEP = (FLOOR - SHEET.top) / RES.prints.length;
const chipFrom = (i: number) => ({ x: TRAY.x + 26, y: TRAY.y + 84 + i * 58 });
const chipTo = (i: number) => ({ x: SHEET.x + 34, y: SHEET.top + 514 + i * 22 });

const ResumeRoom: React.FC<{ F: number }> = ({ F }) => {
  const cardK = prog(F, RES.card - 4, RES.card + 14, E.ui);
  const trayK = prog(F, RES.tray - 4, RES.tray + 14, E.ui);
  const printed = RES.prints.reduce((acc, p) => acc + PRINT_STEP * prog(F, p - 2, p + 12, E.ui), 0);
  const done = RES.prints.filter((p) => F >= p + 6).length;
  const added = CLIMB_SKILLS.filter((_, i) => F >= RES.chips[i]);
  const flash = CLIMB_SKILLS.map((_, i) => (F >= RES.chips[i] ? 1 - prog(F, RES.chips[i] + 6, RES.chips[i] + 50, E.ui) * 0.65 : 0));
  const dT = F - RES.docx;
  return (
    <>
      <StepTitle n={4} t={F - RES.title} line="Build an IIM-style CV." sub="Skills flow in from what you learn." subT={RES.sub - RES.title} x={110} y={40} size={78} />
      {F >= RES.card - 4 && (
        <div style={{ position: 'absolute', left: TPL.x, top: TPL.y, transform: `translate(${(1 - cardK) * -800}px, 0px)` }}>
          <TemplateCard done={done} pops={RES.prints.map((p) => hitPulse(F - p - 6, 1, 5))} />
        </div>
      )}
      {F >= RES.tray - 4 && (
        <div style={{ position: 'absolute', left: TRAY.x, top: TRAY.y, transform: `translate(${(1 - trayK) * -800}px, 0px)`, width: 640, boxSizing: 'border-box', borderRadius: 10, border: `4px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(10), padding: '16px 22px', fontFamily: FT.display }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, marginBottom: 12 }}>Add skills you&apos;ve unlocked</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            {CLIMB_SKILLS.map((s, i) => <span key={s} style={{ ...CHIP, visibility: F >= RES.chips[i] - 14 ? 'hidden' : 'visible' }}>{s}</span>)}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', left: SHEET.x - 30, top: 0, width: 680, height: FLOOR, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 30, top: FLOOR - printed }}>
          <IIMSheet added={added} flash={flash} />
        </div>
      </div>
      {dT >= 0 && (
        <div style={{ position: 'absolute', left: SHEET.x + 360, top: SHEET.top - 40, transform: `rotate(6deg) scale(${1 + 0.7 * (1 - prog(dT, 0, 6, E.fall))})`, opacity: prog(dT, 0, 3, E.linear), display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 20px', borderRadius: 10, border: `4px solid ${C.ink}`, background: C.accent, color: '#fff', fontFamily: FT.display, fontWeight: 800, fontSize: 26, boxShadow: shadow(6), whiteSpace: 'nowrap' }}>
          <Download size={26} strokeWidth={3} /> Export .docx
        </div>
      )}
      <div style={{ position: 'absolute', left: SHEET.x - 30, top: FLOOR - 8, width: 660, height: 16, background: C.ink, borderRadius: 8, border: `3px solid ${C.paper3}` }} />
      {CLIMB_SKILLS.map((s, i) => {
        const land = RES.chips[i];
        const t0 = land - 14;
        if (F < t0 || F >= land) return null;
        const k = prog(F, t0, land, E.fall);
        const a = chipFrom(i);
        const z = chipTo(i);
        return (
          <div key={s} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${mix(a.x, z.x, k)}px, ${mix(a.y, z.y, k) - Math.sin(k * Math.PI) * 160}px) scale(${mix(1, 0.72, k)})`, transformOrigin: '0 50%' }}>
            <span style={CHIP}>{s}</span>
          </div>
        );
      })}
    </>
  );
};
export { IIM_SECTIONS };

// ---- STEP 5: level up + leaderboard -----------------------------------------------------------------------
export const LVL = { title: at('level', 0.2), roll: [at('level', 0.6), at('level', 4)], stamp: at('level', 4) };
const EDGES = [0, 50, 150, 350, 700];
export const xpAt = (F: number) => roll(F, LVL.roll[0], LVL.roll[1] - LVL.roll[0], 0, CLIMB_XP, E.drift);
const posFor = (xp: number) => {
  for (let i = 0; i < 4; i++) if (xp < EDGES[i + 1]) return i + (xp - EDGES[i]) / (EDGES[i + 1] - EDGES[i]);
  return 4;
};
const GA = { cx: 600, cy: 700, r: 330 };
// Fictional learners (no real accounts are shown).
export const BOARD = [
  { name: 'Kabir Mehta', xp: 1180 },
  { name: 'Riya Kapoor', xp: 740 },
  { name: 'Ananya Rao', xp: 520 },
  { name: 'Dev Malhotra', xp: 430 },
  { name: 'Ishaan Verma', xp: 310 },
  { name: 'Aarav Shah', xp: 180 },
];
/** Frame the rolling XP first passes each learner (or never). */
export const PASSES = BOARD.map((p) => {
  if (p.xp >= CLIMB_XP) return Infinity;
  for (let f = LVL.roll[0]; f <= LVL.roll[1]; f++) if (xpAt(f) > p.xp) return f;
  return Infinity;
});
const LB = { x: 1060, y: 190 };

const LevelRoom: React.FC<{ F: number }> = ({ F }) => {
  const xp = F >= LVL.roll[0] ? xpAt(F) : 0;
  const pos = posFor(xp);
  const lit = Math.floor(pos) + 1;
  const st = F - LVL.stamp;
  const lvlName = GAUGE_LEVELS[Math.min(3, Math.floor(pos))];
  const passed = PASSES.map((f) => (Number.isFinite(f) ? prog(F, f, f + 12, E.ui) : 0));
  const youSlot = BOARD.length - passed.reduce((a, p) => a + p, 0);
  const youRank = BOARD.length + 1 - PASSES.filter((f) => F >= f + 6).length;
  const boardK = prog(F, LVL.title, LVL.title + 16, E.ui);
  return (
    <>
      <StepTitle n={5} t={F - LVL.title} line="Level up." x={110} y={90} dark bar={C.login} />
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
      <div style={{ position: 'absolute', left: LB.x, top: LB.y, opacity: boardK, transform: `translate(${(1 - boardK) * 120}px, 0px)` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 18 }}>
          <span style={{ fontFamily: FT.display, fontWeight: 900, fontSize: 44, color: C.paper }}>Leaderboard</span>
          <span style={{ fontFamily: FT.mono, fontWeight: 700, fontSize: 20, color: C.paper, opacity: 0.6 }}>ranked by XP</span>
        </div>
        <div style={{ position: 'relative', width: 660, height: (BOARD.length + 1) * LB_ROW }}>
          {BOARD.map((p, j) => (
            <div key={p.name} style={{ position: 'absolute', left: 0, top: 0, transform: `translate(0px, ${(j + passed[j]) * LB_ROW}px)` }}>
              <LeaderRow rank={j + 1 + (F >= PASSES[j] + 6 ? 1 : 0)} name={p.name} xp={p.xp} />
            </div>
          ))}
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${-10 * Math.sin(Math.PI * (youSlot % 1))}px, ${youSlot * LB_ROW}px) scale(${1 + 0.03 * Math.sin(Math.PI * (youSlot % 1))})` }}>
            <LeaderRow rank={youRank} name="Meera Iyer" xp={xp} you />
          </div>
        </div>
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
    </>
  );
};

// ---- the world ---------------------------------------------------------------------------------------------
const ROOMS = [GroundRoom, CohortRoom, CourseRoom, SkillsRoom, ResumeRoom, LevelRoom];
const TOTAL_W = RW.reduce((a, w) => a + w, 0);

const Room: React.FC<{ i: number; F: number }> = ({ i, F }) => {
  const o = origin(i);
  const k = rise(i, F);
  const drop = i * SY * (1 - k);
  const land = i > 0 ? F - RISE[i - 1] : -1;
  const bump = land >= 0 ? -10 * hitPulse(land, 1, 4) : 0;
  const Content = ROOMS[i];
  const left = i === 0 ? -3000 : 0;
  const right = i === STEPS - 1 ? 3400 : i === 0 ? TOTAL_W : RW[i];
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
  const st = F - TURN.stats;
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(960px, 600px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)` }}>
        {ROOMS.map((_, i) => <Room key={i} i={i} F={F} />)}
      </div>
      {st >= 0 && F < TURN.statsOut + 14 && <StatsBar stats={STATS} t={st} stagger={STAT_STAGGER} roll={30} fade={prog(F, TURN.statsOut, TURN.statsOut + 14, E.ui)} />}
    </AbsoluteFill>
  );
};

// ---- CTA ---------------------------------------------------------------------------------------------------
export const CTA = { want: at('cta', 1), keys: [2, 2.25, 2.5, 2.75].map((k) => at('cta', k)), send: at('cta', 3.25), seen: at('cta', 3.75), line: at('cta', 4.5), tag: at('cta', 5.5) };

export const Cta: React.FC<{ F: number }> = ({ F }) => {
  const f = F - ACT.cta.from;
  const push = 1 + 0.03 * prog(f, 0, ACT.cta.dur, E.drift);
  const punch = hitPulse(f + 1, 1, 6);
  const typed = 'BETA'.slice(0, CTA.keys.filter((k) => F >= k).length);
  const sent = F >= CTA.send;
  const caret = !sent && F >= CTA.want && Math.floor((F - CTA.want) / 17) % 2 === 0;
  const tagT = F - CTA.tag;
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${push * (1 + 0.015 * punch)})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', left: 1010, top: -40, width: 1000, height: 1300, background: C.accent, borderLeft: `8px solid ${C.ink}` }} />
        <div style={{ position: 'absolute', left: 150, top: 160 }}><Tile size={180} /></div>
        <div style={{ position: 'absolute', left: 150, top: 390 }}><Headline size={124}>UpLearn</Headline></div>
        <div style={{ position: 'absolute', left: 150, top: 555 }}>
          <Wipe t={F - CTA.want} bar={C.ink}><Headline size={62} color={C.ink2}>Want in?</Headline></Wipe>
        </div>
        <div style={{ position: 'absolute', left: 150, top: 670, width: 820 }}>
          <Wipe t={F - CTA.line} bar={C.accent}><Headline size={84}>DM to enroll</Headline></Wipe>
          <Wipe t={F - CTA.line - 5} bar={C.accent}><Headline size={84} color={C.accent}>in the beta.</Headline></Wipe>
        </div>
        {tagT >= 0 && (
          <div style={{ position: 'absolute', left: 150, top: 920, transform: `rotate(-3deg) scale(${1 + 0.7 * (1 - prog(tagT, 0, 6, E.fall))})`, transformOrigin: '0 50%', opacity: prog(tagT, 0, 3, E.linear), display: 'inline-flex', alignItems: 'center', height: 70, padding: '0 26px', borderRadius: 10, border: `5px solid ${C.ink}`, background: C.login, fontFamily: FT.mono, fontWeight: 700, fontSize: 32, letterSpacing: '0.1em', color: C.ink, boxShadow: shadow(6) }}>
            INVITE ONLY
          </div>
        )}
        <div style={{ position: 'absolute', left: 1120, top: 220 }}>
          <DM typed={sent ? '' : typed} caret={caret} sent={sent ? F - CTA.send : -1} sendPress={clickPress(F - CTA.send)} seen={F >= CTA.seen ? F - CTA.seen : -1} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export { WIPE_IN };
