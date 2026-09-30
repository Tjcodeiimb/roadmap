// One component per act. Each takes its LOCAL frame `f` (fractional under motion blur) and draws the
// contents of its page in frame coordinates. Discrete state (statuses, counters, which screen) is decided
// on the whole frame `fi`; continuous motion uses `f`. Event frames are exported for the soundtrack.
import { spring } from 'remotion';
import { ACT, ActId, b, FPS } from './timeline';
import { E, hitPulse, prog, tw } from './lib/anim';
import { clickPress, cursorAt, CursorKey, roll } from './lib/cam';
import { C, F, shadow, TRACK, UI_ZOOM } from './theme';
import { FEED, PHASES, PICK, RESUME, SKILL, WEEK_SKILLS, XP } from './data';
import { CARD_H, CourseBanner, CourseCard, ResourceCard, ResStatus, ResumePage, ROW_H, SkillGroupHeader, SkillPicker, SkillTile, SkillUnlock, Status, TopicHeader, TopicRow, Toast, XPWidget } from './ui';
import { COPY, copySize, MARGIN, Screen, StampLabel, StampTag, TapCursor } from './chrome';
import { measureTracked } from './lib/measure';

const LABEL_Y = 262;
const at = (act: ActId) => (bar: number, beat = 0, sub = 0) => b(bar, beat, sub) - ACT[act].from;
const pulseAt = (f: number, frames: number[]) => frames.reduce((m, x) => Math.max(m, hitPulse(f - x)), 0);
const cursorShow = (f: number, inF: number, outF: number) => (f < inF - 8 || f > outF + 8 ? 0 : Math.min(prog(f, inF - 8, inF, E.ui), 1 - prog(f, outF, outF + 8, E.ui)));

export type ActProps = { f: number };

// ---- MON: pick one ---------------------------------------------------------------------------------
const mon = at('mon');
const FEED_Y = 600;
const PITCH = (CARD_H + 16) * UI_ZOOM;
const LAND_Y = 640;
const SCROLL_END = FEED.indexOf(PICK) * PITCH + FEED_Y - LAND_Y;
export const MON = {
  label: mon(3, 1),
  tag: mon(3, 3),
  scroll: [mon(3, 2), mon(4, 3)] as const,
  tap: mon(5, 0),
  toast: mon(5, 1),
};
const ENROLL = { x: MARGIN + 335 * UI_ZOOM, y: LAND_Y + 212 * UI_ZOOM };
const MON_CURSOR: CursorKey[] = [
  { f: mon(4, 2), x: 1010, y: 1900 },
  { f: MON.tap, x: ENROLL.x, y: ENROLL.y, click: true },
  // leave right after the press so "Enroll" -> "Continue" is visible (lead ~18 frames)
  { f: mon(5, 1), x: 1200, y: 1560, lead: 14 },
];

export const Mon: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const scroll = tw(f, MON.scroll[0], MON.scroll[1], 0, SCROLL_END, E.scroll);
  const press = clickPress(f - MON.tap);
  const enrolled = fi >= MON.tap + 2;
  const cur = cursorAt(f, MON_CURSOR);
  const toastIn = prog(f, MON.toast - 5, MON.toast, E.stamp);
  const push = 0.02 * prog(f, MON.scroll[1], ACT.mon.dur, E.drift);
  return (
    <>
      <div style={{ position: 'absolute', left: 0, top: 580, width: 1080, height: 1340, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: -580, width: 1080, height: 1920, transform: `scale(${1 + push})`, transformOrigin: `540px ${LAND_Y + 300}px` }}>
          {FEED.map((c, i) => {
            const y = FEED_Y + i * PITCH - scroll;
            if (y > 1960 || y + PITCH < 560) return null;
            const pick = c.id === PICK.id;
            return (
              <Screen key={c.id} y={y}>
                <CourseCard course={c} enrolled={pick && enrolled} enrollPress={pick ? press : 0} />
              </Screen>
            );
          })}
        </div>
      </div>
      <StampLabel lines={COPY.mon} size={copySize()} t={f - MON.label} y={LABEL_Y} />
      <StampTag text="29 courses · all free" t={f - MON.tag} x={MARGIN} y={452} />
      {fi >= MON.toast - 5 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1700 + (1 - toastIn) * 260, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.06 * hitPulse(f - MON.toast)})` }}>
          <div style={{ zoom: UI_ZOOM }}>
            <Toast text={`Enrolled in ${PICK.label} ✓`} />
          </div>
        </div>
      )}
      <TapCursor x={cur.x} y={cur.y} press={cur.press} show={cursorShow(f, MON_CURSOR[0].f + 6, MON_CURSOR[2].f - 4)} />
    </>
  );
};

// ---- TUE: watch ------------------------------------------------------------------------------------
const tue = at('tue');
export const TUE = {
  label: tue(6, 1),
  tap1: tue(6, 2),
  done1: tue(6, 3, 2),
  tap2: tue(7, 0),
  done2: tue(7, 1),
};
const TUE_Y = 600;
// Card centres measured from the LabTopic still (topic screen at y = 520), shifted with TUE_Y.
const CARD1 = { x: 560, y: 1050 + (TUE_Y - 520) };
const CARD2 = { x: 600, y: 1294 + (TUE_Y - 520) };
const TUE_CURSOR: CursorKey[] = [
  { f: tue(6, 1), x: 1000, y: 1950 },
  { f: TUE.tap1, x: CARD1.x, y: CARD1.y, click: true },
  { f: TUE.tap2, x: CARD2.x, y: CARD2.y, click: true },
  { f: tue(7, 2), x: 1200, y: 1760 },
];

export const Tue: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const t = PHASES[0].topics[0];
  const s1: ResStatus = fi >= TUE.done1 ? 'done' : fi >= TUE.tap1 ? 'in_progress' : 'todo';
  const s2: ResStatus = fi >= TUE.done2 ? 'done' : fi >= TUE.tap2 ? 'in_progress' : 'todo';
  const done = (s1 === 'done' ? 1 : 0) + (s2 === 'done' ? 1 : 0);
  const status: Status = done === 2 ? 'done' : fi >= TUE.tap1 ? 'active' : 'next';
  const cur = cursorAt(f, TUE_CURSOR);
  const push = 0.02 * prog(f, 0, ACT.tue.dur, E.drift);
  return (
    <>
      <Screen y={TUE_Y} push={push}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F.display }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.ink3 }}>Excel for Finance · {PHASES[0].title}</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, lineHeight: 1.15 }}>{t.title}</div>
          <div style={{ scale: `${1 + 0.035 * pulseAt(f, [TUE.done1, TUE.done2])}` }}>
            <TopicHeader status={status} done={done} total={2} />
          </div>
          <ResourceCard r={t.resources[0]} status={s1} press={clickPress(f - TUE.tap1)} pop={hitPulse(f - TUE.done1)} />
          <ResourceCard r={t.resources[1]} status={s2} press={clickPress(f - TUE.tap2)} pop={hitPulse(f - TUE.done2)} />
        </div>
      </Screen>
      <StampLabel lines={COPY.tue} size={copySize()} t={f - TUE.label} y={LABEL_Y} />
      <TapCursor x={cur.x} y={cur.y} press={cur.press} show={cursorShow(f, TUE_CURSOR[0].f + 6, TUE_CURSOR[3].f - 6)} />
    </>
  );
};

// ---- the roadmap, shared by WED and THU ------------------------------------------------------------
const ROAD_Y = 588;
const ROW_Y0 = 150; // app px, below the course banner
const ROW_PITCH = ROW_H + 10;
export const rowCentreY = (i: number, scroll = 0) => ROAD_Y + (ROW_Y0 + i * ROW_PITCH + ROW_H / 2) * UI_ZOOM - scroll;
const ROAD_TOPICS = [PHASES[0].topics[0], PHASES[0].topics[1], PHASES[1].topics[0], PHASES[1].topics[1], PHASES[1].topics[2]];

type Row = { status: Status; done: number; pop: number };
const CLIP_Y = 572;
const Roadmap: React.FC<{ rows: Row[]; banner: { done: number; active: number }; scroll?: number; bannerPop?: number }> = ({ rows, banner, scroll = 0, bannerPop = 0 }) => (
  <div style={{ position: 'absolute', left: 0, top: CLIP_Y, width: 1080, height: 1920 - CLIP_Y, overflow: 'hidden' }}>
  <div style={{ position: 'absolute', left: 0, top: -CLIP_Y, width: 1080, height: 1920 }}>
  <Screen y={ROAD_Y - scroll}>
    <div style={{ position: 'relative', height: ROW_Y0 + 5 * ROW_PITCH }}>
      <div style={{ scale: `${1 + 0.03 * bannerPop}` }}>
        <CourseBanner done={banner.done} active={banner.active} total={35} color={C.accent} />
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: ROW_Y0 + i * ROW_PITCH }}>
          <TopicRow title={ROAD_TOPICS[i].title} status={r.status} done={r.done} total={ROAD_TOPICS[i].resources.length} pop={r.pop} />
        </div>
      ))}
    </div>
  </Screen>
  </div>
  </div>
);

// ---- WED: it tracks itself -------------------------------------------------------------------------
const wed = at('wed');
export const WED = {
  label: wed(8, 1),
  flips: [wed(8, 2), wed(8, 3), wed(9, 0), wed(9, 1)], // Options 1/3, 2/3, done 3/3; TVM becomes "up next"
};

export const Wed: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const [a1, a2, a3, a4] = WED.flips;
  const optDone = fi >= a3 ? 3 : fi >= a2 ? 2 : fi >= a1 ? 1 : 0;
  const optStatus: Status = optDone === 3 ? 'done' : optDone > 0 ? 'active' : 'next';
  const rows: Row[] = [
    { status: 'done', done: 2, pop: 0 },
    { status: optStatus, done: optDone, pop: pulseAt(f, [a1, a2, a3]) },
    { status: fi >= a4 ? 'next' : 'todo', done: 0, pop: hitPulse(f - a4) },
    { status: 'todo', done: 0, pop: 0 },
    { status: 'todo', done: 0, pop: 0 },
  ];
  const push = 0.015 * prog(f, 0, ACT.wed.dur, E.drift);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push})`, transformOrigin: '540px 1100px' }}>
        <Roadmap rows={rows} banner={{ done: optDone === 3 ? 2 : 1, active: optStatus === 'active' ? 1 : 0 }} bannerPop={hitPulse(f - a3)} />
      </div>
      <StampLabel lines={COPY.wed} size={copySize()} t={f - WED.label} y={LABEL_Y} />
    </>
  );
};

// ---- THU: keep the streak --------------------------------------------------------------------------
const thu = at('thu');
const THU_SCROLL = 470;
export const THU = {
  label: thu(10, 1),
  scroll: [thu(10, 2), thu(11, 0)] as const,
  tvm: [thu(11, 0), thu(11, 1), thu(11, 2)], // 1/3, 2/3, done (+ NPV up next)
  npv: [thu(12, 0), thu(12, 1), thu(12, 2)], // 1/4, 2/4, 3/4
  xpIn: thu(12, 3),
  roll: [thu(13, 0), thu(13, 3)] as const,
  push: [thu(13, 3), thu(15, 0)] as const,
};
/** First frame the rolled XP reaches `v` (for the level-up hit and its sound). */
const firstFrameAt = (from: number, to: number, a: number, z: number, v: number) => {
  for (let x = from; x <= to; x++) if (roll(x, from, to - from, a, z, E.ui) >= v) return x;
  return to;
};
export const THU_LEVEL_UP = firstFrameAt(THU.roll[0], THU.roll[1], XP.wed, XP.thu, 350);

export const Thu: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const tvmDone = fi >= THU.tvm[2] ? 3 : fi >= THU.tvm[1] ? 2 : fi >= THU.tvm[0] ? 1 : 0;
  const npvDone = fi >= THU.npv[2] ? 3 : fi >= THU.npv[1] ? 2 : fi >= THU.npv[0] ? 1 : 0;
  const rows: Row[] = [
    { status: 'done', done: 2, pop: 0 },
    { status: 'done', done: 3, pop: 0 },
    { status: tvmDone === 3 ? 'done' : tvmDone > 0 ? 'active' : 'next', done: tvmDone, pop: pulseAt(f, THU.tvm) },
    { status: npvDone > 0 ? 'active' : fi >= THU.tvm[2] ? 'next' : 'todo', done: npvDone, pop: pulseAt(f, [THU.tvm[2], ...THU.npv]) },
    { status: 'todo', done: 0, pop: 0 },
  ];
  const scroll = tw(f, THU.scroll[0], THU.scroll[1], 0, THU_SCROLL, E.scroll);
  const xp = roll(fi, THU.roll[0], THU.roll[1] - THU.roll[0], XP.wed, XP.thu, E.ui);
  const push = 0.07 * prog(f, THU.push[0], THU.push[1], E.drift);
  const npvY = rowCentreY(3, THU_SCROLL);
  const xpS = stampLift(f - THU.xpIn);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push})`, transformOrigin: `540px ${npvY}px` }}>
        <Roadmap rows={rows} banner={{ done: tvmDone === 3 ? 3 : 2, active: tvmDone > 0 && tvmDone < 3 ? 1 : npvDone > 0 ? 1 : 0 }} scroll={scroll} bannerPop={hitPulse(f - THU.tvm[2])} />
        {xpS.on && (
          <div style={{ position: 'absolute', left: 180, top: 1470, transform: `translate(${-xpS.lift}px, ${-xpS.lift}px)` }}>
            <div style={{ zoom: UI_ZOOM }}>
              <XPWidget xp={xp} streak={4} pop={hitPulse(f - THU_LEVEL_UP)} />
            </div>
          </div>
        )}
      </div>
      <StampLabel lines={COPY.thu} size={copySize()} t={f - THU.label} y={LABEL_Y} />
    </>
  );
};

/** Stamp-on for UI panels: rises off the page for 4 frames then slams down. */
function stampLift(t: number) {
  if (t < -4) return { on: false, lift: 0 };
  return { on: true, lift: t < 0 ? 22 * (1 - E.stamp(prog(t, -4, 0, E.linear))) : -4 * hitPulse(t, 1, 3) };
}

// ---- FRI: unlock it --------------------------------------------------------------------------------
const fri = at('fri');
export const FRI = {
  label: fri(15, 1),
  unlock: fri(15, 2),
  xpChip: fri(15, 3),
  roll: [fri(16, 0), fri(16, 2)] as const,
  tap: fri(16, 3, 2),
  cut: fri(17, 0),
  tile: fri(17, 1),
};
const CARD_X = 79;
const CARD_Y = 540;
const CONTINUE = { x: 540, y: 1352 };
const FRI_CURSOR: CursorKey[] = [
  { f: fri(16, 2), x: 1000, y: 1960 },
  { f: FRI.tap, x: CONTINUE.x, y: CONTINUE.y, click: true },
  { f: fri(17, 2), x: 1150, y: 1500 },
];
// The app's confetti: eight squares in track colours thrown from the badge.
const CONFETTI = [
  { a: -60, d: 90, c: TRACK.marketing }, { a: -20, d: 100, c: TRACK.data }, { a: 20, d: 95, c: '#916d03' }, { a: 60, d: 90, c: TRACK.people },
  { a: -100, d: 85, c: '#3a8703' }, { a: 100, d: 85, c: TRACK.ux }, { a: 150, d: 80, c: '#e00518' }, { a: -150, d: 80, c: '#038719' },
];
const BADGE = { x: 540, y: CARD_Y + 140 * UI_ZOOM };

export const Fri: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const unlocked = fi >= FRI.unlock;
  const sp = spring({ frame: f - FRI.unlock, fps: FPS, config: { stiffness: 260, damping: 16 } });
  const badgeScale = unlocked ? Math.max(0.4, 0.4 + 0.6 * sp) : 1;
  const xp = roll(fi, FRI.roll[0], FRI.roll[1] - FRI.roll[0], XP.thu, XP.fri, E.ui);
  const cur = cursorAt(f, FRI_CURSOR);
  const skills = fi >= FRI.cut;
  const chip = stampLift(f - FRI.xpChip);
  const push = 0.02 * prog(f, FRI.cut, ACT.fri.dur, E.drift);
  return (
    <>
      {!skills ? (
        <>
          <div style={{ scale: `${1 + 0.02 * hitPulse(f - FRI.unlock, 2, 6)}`, transformOrigin: '540px 900px', position: 'absolute', inset: 0 }}>
            <Screen x={CARD_X} y={CARD_Y}>
              <SkillUnlock {...SKILL} unlocked={unlocked} badgeScale={badgeScale} showXp={chip.on} />
            </Screen>
          </div>
          {unlocked &&
            CONFETTI.map((p, i) => {
              const k = prog(f, FRI.unlock + 9, FRI.unlock + 9 + 36, E.ui);
              if (k <= 0 || k >= 1) return null;
              const r = (p.a * Math.PI) / 180;
              const d = p.d * UI_ZOOM * 1.6 * k;
              return <div key={i} style={{ position: 'absolute', left: BADGE.x - 14 + Math.cos(r) * d, top: BADGE.y - 14 + Math.sin(r) * d, width: 28, height: 28, borderRadius: 4, border: `4px solid ${C.ink}`, background: p.c, opacity: 1 - k, transform: `rotate(${180 * k}deg)` }} />;
            })}
          <div style={{ position: 'absolute', left: 180, top: 1500 }}>
            <div style={{ zoom: UI_ZOOM }}>
              <XPWidget xp={xp} streak={5} pop={hitPulse(f - FRI.roll[1])} />
            </div>
          </div>
        </>
      ) : (
        <Screen y={560} push={push}>
          <SkillGroupHeader label={PICK.label} count={fi >= FRI.tile ? '4/36' : '3/36'} pct={fi >= FRI.tile ? 11 : 8} />
          <div style={{ border: `2px solid ${C.ink}`, borderRadius: '0 0 6px 6px', background: C.paper, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {WEEK_SKILLS.map((s, i) => {
              const last = i === WEEK_SKILLS.length - 1;
              const st = stampLift(f - FRI.tile);
              if (last && !st.on) return <div key={s} style={{ height: 94, borderRadius: 6, border: `2px dashed ${C.ink}`, opacity: 0.4 }} />;
              return (
                <div key={s} style={last ? { transform: `translate(${-st.lift / UI_ZOOM}px, ${-st.lift / UI_ZOOM}px)` } : undefined}>
                  <SkillTile name={s} pop={last ? hitPulse(f - FRI.tile) : 0} />
                </div>
              );
            })}
          </div>
        </Screen>
      )}
      <StampLabel lines={COPY.fri} size={copySize()} t={f - FRI.label} y={LABEL_Y} />
      <TapCursor x={cur.x} y={cur.y} press={cur.press} show={cursorShow(f, FRI_CURSOR[0].f + 6, FRI_CURSOR[2].f - 6)} />
    </>
  );
};

// ---- SAT: straight onto your resume ----------------------------------------------------------------
const sat = at('sat');
export const SAT = {
  label: sat(19, 1),
  picker: sat(19, 2),
  tapChip: sat(19, 3),
  tapAdd: sat(20, 0),
  cut: sat(20, 0, 2),
  land: sat(20, 2),
  flat: sat(20, 3),
  push: [sat(20, 3), sat(22, 0)] as const,
};
const RESUME_Y = 600;
const PICKER_Y = 1060;
const CHIP = { x: 305, y: PICKER_Y + 530 };
const ADD = { x: 790, y: PICKER_Y + 684 };
const SAT_CURSOR: CursorKey[] = [
  { f: sat(19, 2), x: 1000, y: 1960 },
  { f: SAT.tapChip, x: CHIP.x, y: CHIP.y, click: true },
  { f: SAT.tapAdd, x: ADD.x, y: ADD.y, click: true },
  { f: sat(20, 2), x: 1220, y: 1900 },
];
export const SKILLS_LINE_Y = RESUME_Y + 292 * UI_ZOOM; // the resume's Skills section, from the LabResume still

export const Sat: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const pickerOpen = fi >= SAT.picker - 4 && fi < SAT.cut;
  const pk = stampLift(f - SAT.picker);
  const selected = fi >= SAT.tapChip ? SKILL.name : null;
  const cur = cursorAt(f, SAT_CURSOR);
  const added = fi >= SAT.flat;
  const falling = fi >= SAT.cut && fi < SAT.flat;
  // the chip drops from above the page and lands (fastest on contact) on SAT.land
  const drop = falling ? tw(f, SAT.cut, SAT.land, -520, 0, E.stamp) : 0;
  const squash = falling ? 6 * hitPulse(f - SAT.land, 1, 3) : 0;
  const flash = added ? 0.85 * (1 - prog(f, SAT.flat + 20, SAT.flat + 80, E.ui)) : 0;
  const push = 0.1 * prog(f, SAT.push[0], SAT.push[1], E.drift);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + push})`, transformOrigin: `540px ${SKILLS_LINE_Y}px` }}>
        <Screen y={RESUME_Y}>
          <ResumePage
            skills={added ? [...RESUME.skills, SKILL.name] : RESUME.skills}
            flash={flash}
            landing={
              falling ? (
                <div style={{ position: 'absolute', left: 0, top: 22, transform: `translate(${squash / UI_ZOOM}px, ${drop / UI_ZOOM + squash / UI_ZOOM}px)` }}>
                  <span style={{ display: 'inline-block', borderRadius: 4, border: `2px solid ${C.ink}`, padding: '5px 9px', fontSize: 11, fontWeight: 800, fontFamily: F.display, background: C.excel, color: '#fff', boxShadow: shadow(Math.max(0, 4 - squash / UI_ZOOM)) }}>{SKILL.name}</span>
                </div>
              ) : null
            }
          />
        </Screen>
      </div>
      {pickerOpen && (
        <>
          <div style={{ position: 'absolute', left: 0, top: 580, width: 1080, height: 1400, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{ position: 'absolute', inset: 0, transform: `translate(${-pk.lift}px, ${-pk.lift}px)` }}>
            <Screen y={PICKER_Y}>
              <SkillPicker skills={WEEK_SKILLS} selected={selected} press={clickPress(f - SAT.tapChip)} confirmPress={clickPress(f - SAT.tapAdd)} />
            </Screen>
          </div>
        </>
      )}
      <StampLabel lines={COPY.sat} size={copySize()} t={f - SAT.label} y={LABEL_Y} />
      <TapCursor x={cur.x} y={cur.y} press={cur.press} show={cursorShow(f, SAT_CURSOR[0].f + 6, SAT_CURSOR[3].f - 6)} />
    </>
  );
};

// ---- SUN: the week, then the end card ----------------------------------------------------------------
const sun = at('sun');
export const SUN = {
  strip: [sun(22, 0, 2), sun(22, 2)] as const, // the week strip glides to the middle of the page
  xp: sun(22, 2),
  outro: sun(23, 0), // the whole pad tears away
  tile: sun(23, 1),
  name: sun(23, 2),
  line: sun(24, 0),
  tag: sun(24, 1),
};
export const SUN_STRIP_DY = 640;

export const Sun: React.FC<ActProps> = ({ f }) => {
  const s = stampLift(f - SUN.xp);
  if (!s.on) return null;
  return (
    <div style={{ position: 'absolute', left: 180, top: 900, transform: `translate(${-s.lift}px, ${-s.lift}px)` }}>
      <div style={{ zoom: UI_ZOOM }}>
        <XPWidget xp={XP.fri} streak={6} />
      </div>
    </div>
  );
};

/** The login page's brand panel on its yellow ground: the UF tile, the name, then the last line. */
export const EndCard: React.FC<{ f: number }> = ({ f }) => {
  const tile = stampLift(f - SUN.tile);
  const nameSize = Math.min(124, Math.floor((960 / measureTracked('UpForge Learning', 100, 800, -0.03, F.display)) * 100));
  const nameOn = Math.round(f) >= SUN.name - 3;
  const nameDrop = nameOn ? -30 * (1 - prog(f, SUN.name - 3, SUN.name, E.stamp)) : 0;
  const size = copySize();
  const lineW = Math.max(...COPY.end.map((l) => measureTracked(l, size, 900, -0.025, F.display))) + 2 * 34 + 12;
  const tagW = measureTracked('Invite-only beta', 40, 700, 0, F.mono) + 44 + 10;
  const push = 0.03 * prog(f, SUN.tile, ACT.sun.dur - (SUN.outro), E.drift);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.login, transform: `scale(${1 + push})`, transformOrigin: '540px 900px' }}>
      {tile.on && (
        <div style={{ position: 'absolute', left: 540 - 96, top: 540, width: 192, height: 192, borderRadius: 24, border: `8px solid ${C.ink}`, background: C.accent, color: C.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 800, fontSize: 76, boxShadow: shadow(12 + tile.lift), transform: `translate(${-tile.lift}px, ${-tile.lift}px)` }}>
          UF
        </div>
      )}
      {nameOn && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 800, textAlign: 'center', fontFamily: F.display, fontWeight: 800, fontSize: nameSize, letterSpacing: '-0.03em', color: C.ink, transform: `translate(0px, ${nameDrop}px)` }}>
          UpForge Learning
        </div>
      )}
      <StampLabel lines={COPY.end} size={size} t={f - SUN.line} x={(1080 - lineW) / 2} y={1040} />
      <StampTag text="Invite-only beta" t={f - SUN.tag} x={(1080 - tagW) / 2} y={1370} bg={C.ink} fg={C.login} />
    </div>
  );
};

export const ACTS: Record<ActId, React.FC<ActProps>> = {
  open: ({ f }) => (
    <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + 0.04 * prog(f, OPEN.label, ACT.open.dur, E.drift)})`, transformOrigin: '400px 860px' }}>
      <StampLabel lines={COPY.open} size={copySize()} t={f - OPEN.label} y={760} x={MARGIN} />
    </div>
  ),
  mon: Mon,
  tue: Tue,
  wed: Wed,
  thu: Thu,
  fri: Fri,
  sat: Sat,
  sun: Sun,
};

// ---- OPEN: the empty week ---------------------------------------------------------------------------
const open = at('open');
export const OPEN = {
  tabs: [0, 1, 2, 3, 4, 5, 6].map((i) => open(1, i * 0.5)), // one tab per eighth note across bar 1
  label: open(2, 0),
};
