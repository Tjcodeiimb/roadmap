// Film 2, "Close the tabs". Each act takes its LOCAL frame `f` and returns the whole frame: the laptop
// (through the act's camera) plus the copy. Discrete state on the whole frame `fi`; motion on `f`.
import { ACT, ActId, b } from './timeline';
import { E, hitPulse, prog } from './lib/anim';
import { camAt, CamKey, clickPress, cursorAt, CursorKey, roll } from './lib/cam';
import { C, F, shadow } from './theme';
import { ADD_SKILLS, COHORT, EXCEL_TOPICS, PICK_SKILLS, RESUME } from './data';
import { CourseBanner, ResumePage, Status, TopicRow, Toast } from './ui';
import { COPY, copySize, StampLabel, StampTag } from './chrome';
import { measureTracked } from './lib/measure';
import { ADD_BTN, AppShell, Browser, BROWSER_BAR, Clutter, ClutterWindow, CohortDetail, COHORT_CARD_CENTRE, EditorColumn, ENROLL_BTN, GroupPicker, Laptop, LID, LID_H, MarketplaceCohorts, onScreen, SCREEN, SIDEBAR_W } from './desktop';

export type ActProps = { f: number };
const at = (act: ActId) => (bar: number, beat = 0, sub = 0) => b(bar, beat, sub) - ACT[act].from;
const pulseAt = (f: number, frames: number[]) => frames.reduce((m, x) => Math.max(m, hitPulse(f - x)), 0);

// ---- stage: the laptop through a camera --------------------------------------------------------------
/** The camera holds world point (x, y) (laptop px) at this frame point. */
export const VC = { x: 540, y: 1320 };
const REST: Omit<CamKey, 'f'> = { s: 1.02, x: LID.w / 2, y: (LID_H + 46) / 2 };
const W_ = (x: number, y: number) => onScreen(x, y);

const Stage: React.FC<{ cam: { s: number; x: number; y: number }; punch?: number; children: React.ReactNode }> = ({ cam, punch = 0, children }) => {
  const s = cam.s * (1 + 0.025 * punch);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${VC.x - cam.x * s}px, ${VC.y - cam.y * s}px)` }}>
      <div style={{ zoom: s }}>
        <Laptop>{children}</Laptop>
      </div>
    </div>
  );
};

const Desktop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', inset: 0, background: C.paper3, backgroundImage: `radial-gradient(${C.ink3}55 1.5px, transparent 1.5px)`, backgroundSize: '28px 28px' }}>{children}</div>
);

/** Arrow pointer in screen px (inside the browser's page area). */
const Pointer: React.FC<{ x: number; y: number; press: number; show?: boolean }> = ({ x, y, press, show = true }) =>
  show ? (
    <svg width={40} height={52} viewBox="0 0 20 26" style={{ position: 'absolute', left: x - 3, top: y - 2, transform: `scale(${1 - 0.15 * press})`, transformOrigin: '3px 2px' }}>
      <path d="M1.5 1.5 L1.5 20 L6.2 15.6 L9.4 23 L12.6 21.6 L9.4 14.4 L15.8 14.4 Z" fill={C.ink} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  ) : null;

const LABEL = { x: 60, y: 150 };

// ---- TABS: the problem ------------------------------------------------------------------------------------
const tabs = at('tabs');
const TITLES = ['Excel tutorial — part 7 of 23', 'Intro to SQL — Lecture 1', 'Financial_Modelling.pdf', 'Free course — Module 1', 'Top 10 Excel tricks', 'Pivot tables explained', 'VLOOKUP vs XLOOKUP?', 'Consulting frameworks'];
const CLUTTER: Clutter[] = [
  { kind: 'video', title: 'Excel tutorial — part 7 of 23', x: 90, y: 150, w: 620, h: 420 },
  { kind: 'pdf', title: 'Financial_Modelling.pdf (412 pages)', x: 760, y: 120, w: 560, h: 470 },
  { kind: 'course', title: 'Free course — Module 1', x: 380, y: 380, w: 600, h: 360 },
  { kind: 'video', title: 'Intro to SQL — Lecture 1 (2h 14m)', x: 40, y: 470, w: 560, h: 380 },
  { kind: 'book', title: 'Consulting frameworks — ch. 3', x: 880, y: 430, w: 500, h: 420 },
  { kind: 'list', title: 'Top 10 Excel tricks you NEED', x: 260, y: 90, w: 520, h: 330 },
  { kind: 'video', title: 'Pivot tables explained (full)', x: 640, y: 300, w: 580, h: 400 },
  { kind: 'pdf', title: 'SQL_cheatsheet_final_v2.pdf', x: 120, y: 280, w: 480, h: 400 },
  { kind: 'course', title: 'FP&A basics — week 1', x: 820, y: 60, w: 520, h: 330 },
  { kind: 'video', title: 'VLOOKUP vs XLOOKUP?', x: 470, y: 520, w: 560, h: 360 },
];
export const TABS = {
  count: [tabs(1, 0), tabs(2, 0)] as const, // the tab counter rolls 3 -> 47
  windows: CLUTTER.map((_, i) => tabs(1, 2) + Math.round((i * (tabs(3, 3) - tabs(1, 2))) / (CLUTTER.length - 1))),
  label1: tabs(2, 0),
  label2: tabs(3, 0),
  close: ACT.tabs.dur - 8, // everything snaps shut into the downbeat of bar 4
};

export const Tabs: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const n = roll(fi, TABS.count[0], TABS.count[1] - TABS.count[0], 3, 47, E.ui);
  const shut = prog(f, TABS.close, ACT.tabs.dur, E.stamp);
  const cam = { ...REST, s: REST.s * Math.exp(Math.log(1.14) * prog(f, 0, ACT.tabs.dur, E.drift)) };
  const tabList = Array.from({ length: Math.min(n, 30) }, (_, i) => TITLES[i % TITLES.length]);
  return (
    <>
      <Stage cam={cam}>
        <Desktop>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 - 0.9 * shut})`, opacity: 1 - shut }}>
            <Browser tabs={tabList} active={tabList.length - 1} path="…/watch?v=excel-part-7" count={n} x={30} y={24} w={SCREEN.w - 60} h={SCREEN.h - 48}>
              <div style={{ padding: 24, fontFamily: F.display, fontSize: 22, fontWeight: 800, color: C.ink3 }}>Up next: part 8 of 23 · 38:12</div>
            </Browser>
            {CLUTTER.map((c, i) => {
              const t = f - TABS.windows[i];
              if (t < -3) return null;
              return <ClutterWindow key={i} c={c} scale={t < 0 ? 0.85 : 1 + 0.04 * hitPulse(t)} />;
            })}
          </div>
        </Desktop>
      </Stage>
      <StampLabel lines={COPY.tabs1} size={copySize()} t={f - TABS.label1} x={LABEL.x} y={LABEL.y} />
      <StampLabel lines={COPY.tabs2} size={copySize()} t={f - TABS.label2} x={LABEL.x + 150} y={LABEL.y + 190} />
    </>
  );
};

// ---- SNAP: one window --------------------------------------------------------------------------------------
const snap = at('snap');
export const SNAP = { label: snap(4, 1), click: snap(4, 3) };
const NAV_MARKET = { x: SIDEBAR_W / 2, y: BROWSER_BAR + 20 + 36 + 14 + 38 + 6 + 19 };
const SNAP_CURSOR: CursorKey[] = [
  { f: snap(4, 1), x: 760, y: 620 },
  { f: SNAP.click, x: NAV_MARKET.x, y: NAV_MARKET.y, click: true },
];

const Empty: React.FC = () => (
  <div style={{ padding: '32px 40px', fontFamily: F.display }}>
    <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em' }}>Welcome back, Meera</div>
    <div style={{ fontSize: 17, color: C.ink2, marginTop: 6 }}>Here&apos;s where you left off.</div>
    <div style={{ marginTop: 30, borderRadius: 10, border: `3px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(6), padding: '50px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>No courses yet</div>
      <div style={{ fontSize: 15, color: C.ink2, maxWidth: 440 }}>Browse the marketplace to enroll in a course, or a curated cohort bundle that strings a few together.</div>
    </div>
  </div>
);

export const Snap: React.FC<ActProps> = ({ f }) => {
  const cur = cursorAt(f, SNAP_CURSOR);
  const cam = { ...REST, s: REST.s * Math.exp(Math.log(1.1) * prog(f, 0, ACT.snap.dur, E.drift)) };
  return (
    <>
      <Stage cam={cam} punch={hitPulse(f, 2, 7)}>
        <Desktop>
          <Browser tabs={['UpForge Learning']} path="/dashboard">
            <AppShell active="dashboard" courses={[]} xp={0} streak={1}>
              <Empty />
            </AppShell>
            <Pointer x={cur.x} y={cur.y - BROWSER_BAR} press={cur.press} show={f >= SNAP_CURSOR[0].f - 10} />
          </Browser>
        </Desktop>
      </Stage>
      <StampLabel lines={COPY.snap} size={copySize()} t={f - SNAP.label} x={LABEL.x} y={LABEL.y} />
    </>
  );
};

// ---- COHORT: courses, bundled ---------------------------------------------------------------------------
const co = at('cohort');
export const COH = {
  label: co(5, 1),
  zoom: [co(5, 0), co(5, 2)] as const,
  clickCard: co(5, 3),
  cut: co(6, 0),
  rows: [0, 1, 2, 3, 4].map((i) => co(6, 1) + Math.round((i * (co(6, 3) - co(6, 1))) / 4)),
  enroll: co(7, 0),
  nav: [0, 1, 2, 3, 4].map((i) => co(7, 1) + Math.round((i * (co(7, 2) - co(7, 1))) / 2)),
  toast: co(7, 2),
};
const CARD_C = COHORT_CARD_CENTRE;
const COH_CURSOR: CursorKey[] = [
  { f: co(5, 0), x: NAV_MARKET.x, y: NAV_MARKET.y },
  { f: COH.clickCard, x: CARD_C.x + 40, y: CARD_C.y + 10, click: true },
  { f: COH.cut + 1, x: ENROLL_BTN.x + 60, y: ENROLL_BTN.y + 120 },
  { f: COH.enroll, x: ENROLL_BTN.x, y: ENROLL_BTN.y, click: true },
  { f: co(7, 3), x: ENROLL_BTN.x + 240, y: ENROLL_BTN.y + 260 },
];
const PATH_C = W_(SIDEBAR_W + 36 + 400, BROWSER_BAR + 300 + 150);

export const Cohort: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const detail = fi >= COH.cut;
  const enrolled = fi >= COH.enroll + 2;
  const cur = cursorAt(f, COH_CURSOR);
  const cardW = W_(CARD_C.x, CARD_C.y);
  const overview = W_(560, 450);
  const cam = detail
    ? camAt(f, [
        { f: COH.cut, s: 1.75, x: PATH_C.x - 30, y: PATH_C.y - 40 },
        { f: COH.enroll - 6, s: 1.8, x: PATH_C.x - 10, y: PATH_C.y - 60, ease: E.drift },
        { f: COH.toast, s: 1.25, x: overview.x, y: overview.y, ease: E.scroll },
        { f: ACT.cohort.dur, s: 1.3, x: overview.x, y: overview.y, ease: E.drift },
      ])
    : camAt(f, [
        { f: COH.zoom[0], ...REST },
        { f: COH.zoom[1], s: 1.9, x: cardW.x, y: cardW.y, ease: E.scroll },
        { f: COH.cut, s: 1.98, x: cardW.x, y: cardW.y, ease: E.drift },
      ]);
  const navCourses = COHORT.courses.map((c, i) => ({ label: c.label, color: c.color, t: enrolled ? prog(f, COH.nav[i] - 6, COH.nav[i], E.stamp) : 0 }));
  const toastIn = prog(f, COH.toast - 5, COH.toast, E.stamp);
  return (
    <>
      <Stage cam={cam}>
        <Desktop>
          <Browser tabs={['UpForge Learning']} path={detail ? '/marketplace/cohort/new-analyst-bootcamp' : '/marketplace?tab=cohorts'}>
            <AppShell active="marketplace" courses={navCourses} xp={0} streak={1}>
              {detail ? (
                <CohortDetail enrollPress={clickPress(f - COH.enroll)} enrolled={enrolled} pops={COH.rows.map((r) => hitPulse(f - r))} />
              ) : (
                <MarketplaceCohorts press={clickPress(f - COH.clickCard)} />
              )}
            </AppShell>
            {fi >= COH.toast - 5 && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: SCREEN.h - BROWSER_BAR - 80 + (1 - toastIn) * 120, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.06 * hitPulse(f - COH.toast)})` }}>
                <div style={{ zoom: 1.3 }}>
                  <Toast text={`Enrolled in ${COHORT.label} ✓`} />
                </div>
              </div>
            )}
            <Pointer x={cur.x} y={cur.y - BROWSER_BAR} press={cur.press} />
          </Browser>
        </Desktop>
      </Stage>
      <StampLabel lines={COPY.cohort} size={copySize()} t={f - COH.label} x={LABEL.x} y={LABEL.y} />
    </>
  );
};

// ---- ROAD: it tracks itself -------------------------------------------------------------------------------
const rd = at('road');
export const ROAD = {
  label: rd(8, 1),
  flips: [rd(8, 1), rd(8, 2), rd(8, 3), rd(9, 0), rd(9, 1), rd(9, 2), rd(9, 3), rd(10, 0)],
};
const ROW0 = { x: SIDEBAR_W + 36, y: BROWSER_BAR + 26 + 50 + 170 };
const ROW_P = 86;

export const Road: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const [a1, a2, a3, a4, a5, a6, a7, a8] = ROAD.flips;
  const k = (x: number) => (fi >= x ? 1 : 0);
  const formulas = k(a2) + k(a3) + k(a4);
  const core = k(a5) + k(a6) + k(a7) + k(a8);
  const rows: { status: Status; done: number; pop: number }[] = [
    { status: fi >= a1 ? 'done' : 'active', done: fi >= a1 ? 3 : 2, pop: hitPulse(f - a1) },
    { status: formulas === 3 ? 'done' : formulas > 0 ? 'active' : 'next', done: formulas, pop: pulseAt(f, [a2, a3, a4]) },
    { status: core === 4 ? 'done' : core > 0 ? 'active' : fi >= a4 ? 'next' : 'todo', done: core, pop: pulseAt(f, [a4, a5, a6, a7, a8]) },
    { status: fi >= a8 ? 'next' : 'todo', done: 0, pop: hitPulse(f - a8) },
    { status: 'todo', done: 0, pop: 0 },
  ];
  const done = k(a1) + (formulas === 3 ? 1 : 0) + (core === 4 ? 1 : 0);
  const toastAt = [a1, a4, a8].filter((x) => fi >= x).pop();
  const toastT = toastAt != null ? f - toastAt : -99;
  const showToast = toastAt != null && toastT < 40;
  const c0 = W_(ROW0.x + 380, ROW0.y + 60);
  const c1 = W_(ROW0.x + 380, ROW0.y + 2 * ROW_P + 40);
  const cam = camAt(f, [
    { f: 0, s: 1.75, x: c0.x, y: c0.y },
    { f: ACT.road.dur, s: 1.85, x: c1.x, y: c1.y, ease: E.drift },
  ]);
  return (
    <>
      <Stage cam={cam}>
        <Desktop>
          <Browser tabs={['UpForge Learning']} path="/track/excel">
            <AppShell active="Excel for Business" courses={COHORT.courses.map((c) => ({ label: c.label, color: c.color }))} xp={200} streak={3}>
              <div style={{ padding: '26px 36px', fontFamily: F.display }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em', marginBottom: 14 }}>Excel for Business</div>
                <div style={{ width: 760, scale: `${1 + 0.02 * pulseAt(f, [a1, a4, a8])}` }}>
                  <CourseBanner done={done} active={rows.filter((r) => r.status === 'active').length} total={43} color="#038766" />
                </div>
                <div style={{ position: 'relative', width: 760, marginTop: 14 }}>
                  {rows.map((r, i) => (
                    <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * ROW_P }}>
                      <TopicRow title={EXCEL_TOPICS[i].title} status={r.status} done={r.done} total={EXCEL_TOPICS[i].total} pop={r.pop} />
                    </div>
                  ))}
                </div>
              </div>
            </AppShell>
            {showToast && (
              <div style={{ position: 'absolute', left: SIDEBAR_W, right: 0, top: 420 + (1 - prog(toastT, -5, 0, E.stamp)) * 60, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.06 * hitPulse(toastT)})` }}>
                <div style={{ zoom: 1.4 }}>
                  <Toast text="New skill unlocked! ✓" />
                </div>
              </div>
            )}
          </Browser>
        </Desktop>
      </Stage>
      <StampLabel lines={COPY.road} size={copySize()} t={f - ROAD.label} x={LABEL.x} y={LABEL.y} />
    </>
  );
};

// ---- RESUME: skills -> your resume -------------------------------------------------------------------------
const rs = at('resume');
export const RES = {
  label: rs(11, 1),
  clickAdd: rs(11, 2),
  open: rs(11, 3),
  chips: [rs(12, 0), rs(12, 1), rs(12, 2)],
  confirm: rs(12, 3),
  close: rs(13, 0),
  entries: [rs(13, 0, 2), rs(13, 1), rs(13, 1, 2)],
  pan: [rs(13, 1), rs(13, 3)] as const,
  word: rs(14, 1),
  download: rs(14, 2),
  shut: ACT.resume.dur - 8,
};
const ED = { x: SIDEBAR_W + 36, y: BROWSER_BAR + 26 + 60 }; // editor column origin (screen px)
const PV = { x: SIDEBAR_W + 36 + 600 + 30, y: BROWSER_BAR + 26 + 60 }; // preview column origin
const PZ = 1.5; // the picker is shown at 1.5x (600 px wide), like a desktop modal
const PICKER = { x: SIDEBAR_W + (SCREEN.w - SIDEBAR_W) / 2 - 300, y: BROWSER_BAR + 110 };
// Chip centres inside the picker (picker px), measured from a still.
export const CHIP_POS: Record<string, { x: number; y: number }> = {
  'Formulas & Cell References': { x: 110, y: 150 },
  'Core Functions: SUM, AVERAGE, IF, COUNT': { x: 150, y: 188 },
  'SELECT, WHERE, and ORDER BY': { x: 110, y: 262 },
};
export const CONFIRM = { x: 330, y: 315 };
const pk = (p: { x: number; y: number }) => ({ x: PICKER.x + p.x * PZ, y: PICKER.y + p.y * PZ });
const WORD_BTN = { x: PV.x + 470, y: PV.y + 18 };
const RES_CURSOR: CursorKey[] = [
  { f: rs(11, 0), x: ED.x + 300, y: ED.y + 330 },
  { f: RES.clickAdd, x: ED.x + ADD_BTN.x, y: ED.y + ADD_BTN.y, click: true },
  ...RES.chips.map((c, i): CursorKey => ({ f: c, ...pk(CHIP_POS[ADD_SKILLS[i]]), click: true })),
  { f: RES.confirm, ...pk(CONFIRM), click: true },
  { f: rs(13, 2), x: WORD_BTN.x - 80, y: WORD_BTN.y + 160 },
  { f: RES.word, x: WORD_BTN.x, y: WORD_BTN.y, click: true },
  { f: rs(14, 3), x: WORD_BTN.x - 60, y: WORD_BTN.y + 240 },
];

export const Resume: React.FC<ActProps> = ({ f }) => {
  const fi = Math.round(f);
  const open = fi >= RES.open - 3 && fi < RES.close;
  const selected = ADD_SKILLS.filter((_, i) => fi >= RES.chips[i]);
  const added = fi >= RES.close;
  const shown = RESUME.skills.concat(ADD_SKILLS.filter((_, i) => added && fi >= RES.entries[i]));
  const cur = cursorAt(f, RES_CURSOR);
  const edC = W_(ED.x + 280, ED.y + 200);
  const pkC = W_(PICKER.x + 200 * PZ, PICKER.y + 190 * PZ);
  const pvC = W_(PV.x + 260, PV.y + 280);
  const home = W_(720, 450);
  const cam = camAt(f, [
    { f: 0, s: 1.35, x: home.x, y: home.y },
    { f: RES.clickAdd - 8, s: 1.9, x: edC.x, y: edC.y, ease: E.scroll },
    { f: RES.open, s: 1.9, x: edC.x, y: edC.y, ease: E.drift },
    { f: RES.chips[0] - 4, s: 1.75, x: pkC.x, y: pkC.y, ease: E.scroll },
    { f: RES.close, s: 1.8, x: pkC.x, y: pkC.y, ease: E.drift },
    { f: RES.pan[1], s: 1.75, x: pvC.x, y: pvC.y, ease: E.scroll },
    { f: RES.word, s: 1.8, x: pvC.x + 40, y: pvC.y - 60, ease: E.drift },
    { f: ACT.resume.dur, s: 1.7, x: pvC.x + 40, y: pvC.y - 60, ease: E.drift },
  ]);
  const shut = prog(f, RES.shut, ACT.resume.dur, E.stamp);
  const flash = added ? 0.85 * (1 - prog(f, RES.entries[2] + 30, RES.entries[2] + 90, E.ui)) : 0;
  const fill = added ? 82 : 78;
  const wp = clickPress(f - RES.word);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 - 0.55 * shut})`, transformOrigin: `${VC.x}px ${VC.y}px`, opacity: 1 - shut }}>
        <Stage cam={cam}>
          <Desktop>
            <Browser tabs={['UpForge Learning']} path="/resume/meera-iyer" download={fi >= RES.download ? 'Meera_Iyer_Resume.docx' : null}>
              <AppShell active="resume" courses={COHORT.courses.map((c) => ({ label: c.label, color: c.color }))} xp={410} streak={6}>
                <div style={{ position: 'absolute', left: 36, top: 26, fontFamily: F.display, fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: C.ink }}>Resume</div>
                <div style={{ position: 'absolute', left: ED.x - SIDEBAR_W, top: ED.y - BROWSER_BAR, width: 600 }}>
                  <EditorColumn entries={shown} newCount={added ? 1 : 4} pops={shown.map((_, i) => (i >= RESUME.skills.length ? hitPulse(f - RES.entries[i - RESUME.skills.length]) : 0))} addPress={clickPress(f - RES.clickAdd)} />
                </div>
                <div style={{ position: 'absolute', left: PV.x - SIDEBAR_W, top: PV.y - BROWSER_BAR, width: 520, fontFamily: F.display }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: C.success, scale: `${1 + 0.08 * hitPulse(f - RES.entries[2])}` }}>Fits on one page · {fill}% full</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontSize: 13, fontWeight: 800, transform: `translate(${3 * wp}px, ${3 * wp}px)`, boxShadow: shadow(3 - 3 * wp) }}>⤓ Word</span>
                  </div>
                  <div style={{ borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper3, padding: 10 }}>
                    <div style={{ zoom: 1.24 }}>
                      <ResumePage skills={shown} flash={flash} />
                    </div>
                  </div>
                </div>
              </AppShell>
              {open && (
                <>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
                  <div style={{ position: 'absolute', left: PICKER.x / PZ, top: (PICKER.y - BROWSER_BAR) / PZ, zoom: PZ, transform: `translate(0px, ${(1 - prog(f, RES.open - 3, RES.open, E.stamp)) * -14}px)` }}>
                    <GroupPicker groups={PICK_SKILLS} selected={selected} confirmPress={clickPress(f - RES.confirm)} pops={Object.fromEntries(ADD_SKILLS.map((s, i) => [s, hitPulse(f - RES.chips[i])]))} />
                  </div>
                </>
              )}
              <Pointer x={cur.x} y={cur.y - BROWSER_BAR} press={cur.press} />
            </Browser>
          </Desktop>
        </Stage>
      </div>
      <StampLabel lines={COPY.resume} size={copySize()} t={f - RES.label} x={LABEL.x} y={LABEL.y} />
    </>
  );
};

// ---- END ---------------------------------------------------------------------------------------------------
const en = at('end');
export const END = { tile: en(15, 1), name: en(15, 2), line: en(16, 0), tag: en(16, 1) };

export const End: React.FC<ActProps> = ({ f }) => {
  const t = f - END.tile;
  const lift = t < -4 ? null : t < 0 ? 22 * (1 - E.stamp(prog(t, -4, 0, E.linear))) : -4 * hitPulse(t, 1, 3);
  const nameSize = Math.min(124, Math.floor((960 / measureTracked('UpForge Learning', 100, 800, -0.03, F.display)) * 100));
  const nameOn = Math.round(f) >= END.name - 3;
  const nameDrop = nameOn ? -30 * (1 - prog(f, END.name - 3, END.name, E.stamp)) : 0;
  const size = copySize();
  const lineW = Math.max(...COPY.end.map((l) => measureTracked(l, size, 900, -0.025, F.display))) + 2 * 34 + 12;
  const tagW = measureTracked('Invite-only beta', 40, 700, 0, F.mono) + 44 + 10;
  const push = 0.03 * prog(f, 0, ACT.end.dur, E.drift);
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.login, transform: `scale(${1 + push})`, transformOrigin: '540px 960px' }}>
      {lift != null && (
        <div style={{ position: 'absolute', left: 540 - 96, top: 540, width: 192, height: 192, borderRadius: 24, border: `8px solid ${C.ink}`, background: C.accent, color: C.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 800, fontSize: 76, boxShadow: shadow(12 + Math.max(0, lift)), transform: `translate(${-lift}px, ${-lift}px)` }}>UF</div>
      )}
      {nameOn && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 800, textAlign: 'center', fontFamily: F.display, fontWeight: 800, fontSize: nameSize, letterSpacing: '-0.03em', color: C.ink, transform: `translate(0px, ${nameDrop}px)` }}>UpForge Learning</div>
      )}
      <StampLabel lines={COPY.end} size={size} t={f - END.line} x={(1080 - lineW) / 2} y={1040} />
      <StampTag text="Invite-only beta" t={f - END.tag} x={(1080 - tagW) / 2} y={1370} bg={C.ink} fg={C.login} />
    </div>
  );
};

export const ACTS: Record<ActId, React.FC<ActProps>> = { tabs: Tabs, snap: Snap, cohort: Cohort, road: Road, resume: Resume, end: End };
