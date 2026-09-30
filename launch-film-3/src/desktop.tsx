// The laptop and the desktop-width app, rebuilt as pure components. Screen content is authored at
// 1440x900 CSS px (a laptop browser) and shown inside the lid at SCREEN_ZOOM.
import { ArrowRight, ChevronLeft, Download, LayoutDashboard, Lock, Plus, RotateCw, UserRound } from 'lucide-react';
import { ArticleMark } from './icons/formats';
import { CompassMark, TargetMark, ClockMark, PlayMark } from './icons/glyphs';
import { ExcelMark } from './icons/domains';
import { C, F, shadow } from './theme';
import { COHORT, OTHER_COHORTS } from './data';
import { TierBadge, pressStyle } from './ui';

export const SCREEN = { w: 1440, h: 900 };
export const LID = { w: 1000, bezel: 20 };
export const SCREEN_ZOOM = (LID.w - 2 * LID.bezel) / SCREEN.w; // 0.6667
export const LID_H = SCREEN.h * SCREEN_ZOOM + 2 * LID.bezel;

/** Laptop px of a point given in screen px. */
export const onScreen = (x: number, y: number) => ({ x: LID.bezel + x * SCREEN_ZOOM, y: LID.bezel + y * SCREEN_ZOOM });

export const Laptop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'relative', width: LID.w, height: LID_H + 46 }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: LID.w, height: LID_H, borderRadius: 26, background: C.ink, boxShadow: shadow(14) }}>
      <div style={{ position: 'absolute', left: LID.w / 2 - 5, top: 6, width: 10, height: 10, borderRadius: 99, background: '#333' }} />
      <div style={{ position: 'absolute', left: LID.bezel, top: LID.bezel, width: SCREEN.w * SCREEN_ZOOM, height: SCREEN.h * SCREEN_ZOOM, overflow: 'hidden', borderRadius: 6, background: C.paper }}>
        <div style={{ zoom: SCREEN_ZOOM, width: SCREEN.w, height: SCREEN.h, position: 'relative' }}>{children}</div>
      </div>
    </div>
    <div style={{ position: 'absolute', left: -40, top: LID_H, width: LID.w + 80, height: 34, borderRadius: '6px 6px 22px 22px', background: C.ink, boxShadow: shadow(14) }}>
      <div style={{ position: 'absolute', left: LID.w / 2 + 40 - 90, top: 0, width: 180, height: 12, borderRadius: '0 0 12px 12px', background: '#2a2a2a' }} />
    </div>
  </div>
);

// ---- browser chrome ------------------------------------------------------------------------------------
export const BROWSER_BAR = 88;

export const Browser: React.FC<{ tabs: string[]; active?: number; path: string; count?: number; download?: string | null; children?: React.ReactNode; x?: number; y?: number; w?: number; h?: number; tint?: string }> = ({ tabs, active = 0, path, count, download = null, children, x = 0, y = 0, w = SCREEN.w, h = SCREEN.h, tint = C.paper3 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 12, border: `3px solid ${C.ink}`, background: C.paper, overflow: 'hidden', boxShadow: shadow(8), fontFamily: F.display }}>
    <div style={{ height: 44, background: tint, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '0 12px', borderBottom: `3px solid ${C.ink}` }}>
      <div style={{ display: 'flex', gap: 8, alignSelf: 'center', marginRight: 10 }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: 99, background: c, border: `2px solid ${C.ink}` }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 3, flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {tabs.map((t, i) => (
          <div key={i} style={{ flex: '1 1 0', minWidth: 22, maxWidth: 220, height: 34, borderRadius: '8px 8px 0 0', border: `2px solid ${C.ink}`, borderBottom: 'none', background: i === active ? C.paper : C.paper2, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', fontSize: 13, fontWeight: 700, color: C.ink2, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 3, background: t.startsWith('UpForge') ? C.accent : C.ink3 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
          </div>
        ))}
      </div>
      {count != null && (
        <div style={{ alignSelf: 'center', marginLeft: 8, minWidth: 40, height: 28, borderRadius: 6, border: `3px solid ${C.ink}`, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 15, padding: '0 6px', fontVariantNumeric: 'tabular-nums' }}>{count}</div>
      )}
    </div>
    <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: `2px solid ${C.ink}`, background: C.paper2 }}>
      <ChevronLeft size={18} color={C.ink3} />
      <RotateCw size={15} color={C.ink3} />
      <div style={{ flex: 1, height: 30, borderRadius: 99, background: C.paper3, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 14, color: C.ink2, fontWeight: 600 }}>
        <Lock size={12} /> {path}
      </div>
      {download && (
        <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.successSoft, color: C.success, padding: '0 10px', fontSize: 13, fontWeight: 800 }}>
          <Download size={13} /> {download}
        </div>
      )}
    </div>
    <div style={{ position: 'absolute', left: 0, top: BROWSER_BAR, right: 0, bottom: 0, overflow: 'hidden' }}>{children}</div>
  </div>
);

// ---- clutter windows for the problem act (generic, no real brands) -------------------------------------
export type Clutter = { kind: 'video' | 'pdf' | 'course' | 'book' | 'list'; title: string; x: number; y: number; w: number; h: number };

export const ClutterWindow: React.FC<{ c: Clutter; scale?: number }> = ({ c, scale = 1 }) => (
  <div style={{ position: 'absolute', left: c.x, top: c.y, transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
    <Browser tabs={[c.title]} path="…" x={0} y={0} w={c.w} h={c.h} tint={C.paper3}>
      <div style={{ padding: 16, height: '100%', boxSizing: 'border-box', fontFamily: F.display }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{c.title}</div>
        {c.kind === 'video' && (
          <div style={{ height: c.h - 170, borderRadius: 6, background: '#1b1b1b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayMark size={58} color="#fff" strokeWidth={2} />
            <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, height: 6, borderRadius: 3, background: '#555' }}>
              <div style={{ width: '12%', height: '100%', background: '#e00518', borderRadius: 3 }} />
            </div>
          </div>
        )}
        {(c.kind === 'pdf' || c.kind === 'book') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 14, background: C.paper2, border: `2px solid ${C.ink3}`, height: c.h - 170 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ height: 8, width: `${60 + ((i * 37) % 38)}%`, background: C.ink3, opacity: 0.35, borderRadius: 2 }} />
            ))}
          </div>
        )}
        {(c.kind === 'course' || c.kind === 'list') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Module 1', 'Module 2', 'Module 3 🔒', 'Module 4 🔒'].slice(0, Math.floor((c.h - 150) / 44)).map((m) => (
              <div key={m} style={{ height: 34, borderRadius: 4, border: `2px solid ${C.ink3}`, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 13, fontWeight: 700, color: C.ink2 }}>{m.replace(' 🔒', ' · locked')}</div>
            ))}
          </div>
        )}
      </div>
    </Browser>
  </div>
);

// ---- the app's desktop shell (sidebar + main) -----------------------------------------------------------
export const SIDEBAR_W = 260;
export type NavCourse = { label: string; color: string; t?: number };

export const AppShell: React.FC<{ active: string; courses: NavCourse[]; xp: number; streak: number; children: React.ReactNode }> = ({ active, courses, xp, streak, children }) => {
  const Item: React.FC<{ label: string; icon: React.ReactNode; on?: boolean }> = ({ label, icon, on }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 38, padding: '0 12px', borderRadius: 6, border: `2px solid ${on ? C.ink : 'transparent'}`, background: on ? C.accent : 'transparent', color: on ? '#fff' : C.ink, fontWeight: 800, fontSize: 15, boxShadow: on ? shadow(3) : undefined }}>
      {icon} {label}
    </div>
  );
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', fontFamily: F.display, background: C.paper }}>
      <div style={{ width: SIDEBAR_W, borderRight: `3px solid ${C.ink}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 6, background: C.paper }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow(2) }}>UF</div>
          <span style={{ fontWeight: 900, fontSize: 17 }}>UpForge Learning</span>
        </div>
        <Item label="Dashboard" icon={<LayoutDashboard size={17} />} on={active === 'dashboard'} />
        <Item label="Marketplace" icon={<CompassMark size={17} strokeWidth={2} />} on={active === 'marketplace'} />
        <div style={{ margin: '10px 0 4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: C.ink3 }}>MY COURSES</div>
        {courses.map((c) => {
          const t = c.t ?? 1;
          if (t <= 0) return null;
          const on = active === c.label;
          return (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 34, padding: '0 12px', borderRadius: 6, border: `2px solid ${on ? C.ink : 'transparent'}`, background: on ? c.color : 'transparent', color: on ? '#fff' : C.ink, fontWeight: 700, fontSize: 14, transform: `translate(${(1 - t) * -40}px, 0px)`, opacity: Math.min(1, t * 1.5), whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ width: 12, height: 12, flexShrink: 0, borderRadius: 3, border: `2px solid ${C.ink}`, background: c.color }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
            </div>
          );
        })}
        <div style={{ height: 10 }} />
        <Item label="Skills" icon={<TargetMark size={17} strokeWidth={2} />} on={active === 'skills'} />
        <Item label="Resume" icon={<ArticleMark size={17} strokeWidth={2} />} on={active === 'resume'} />
        <Item label="Profile" icon={<UserRound size={17} />} />
        <div style={{ marginTop: 'auto', borderRadius: 6, border: `2px solid ${C.ink}`, overflow: 'hidden', boxShadow: shadow(3) }}>
          <div style={{ background: C.accent, color: '#fff', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 12 }}>
            <span>LEVEL {xp >= 350 ? 4 : xp >= 150 ? 3 : 2}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{xp} XP</span>
          </div>
          <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: C.ink2 }}>{streak}d streak</div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

// ---- cohorts ---------------------------------------------------------------------------------------------
export const CohortCard: React.FC<{ label: string; tier: string; hours: number; courses: { label: string; color: string }[]; summary: string; press?: number; enrollPress?: number; enrolled?: boolean }> = ({ label, tier, hours, courses, summary, press = 0 }) => (
  <div style={{ borderRadius: 10, border: `3px solid ${C.ink}`, background: C.paper2, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, height: 300, boxSizing: 'border-box', fontFamily: F.display, ...pressStyle(6, press) }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ExcelMark size={22} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{label}</div>
        <TierBadge tier={tier} />
      </div>
    </div>
    <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{summary}</div>
    <div style={{ display: 'flex', height: 10, borderRadius: 3, border: `2px solid ${C.ink}`, overflow: 'hidden' }}>
      {courses.map((c) => <span key={c.label} style={{ flex: 1, background: c.color }} />)}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {courses.slice(0, 3).map((c) => (
        <span key={c.label} style={{ borderRadius: 4, border: `2px solid ${C.ink}`, background: C.paper3, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: C.ink2, whiteSpace: 'nowrap' }}>{c.label}</span>
      ))}
      {courses.length > 3 && <span style={{ borderRadius: 4, border: `2px solid ${C.ink}`, background: C.paper3, padding: '3px 8px', fontSize: 11, fontWeight: 800, color: C.ink2 }}>+{courses.length - 3} more</span>}
    </div>
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.ink3, fontWeight: 600 }}>
      <ClockMark size={13} /> {hours}h · {courses.length} courses
    </div>
  </div>
);

export const COHORT_CARDS = [
  { label: COHORT.label, tier: COHORT.tier, hours: COHORT.hours, summary: COHORT.summary, courses: COHORT.courses },
  ...OTHER_COHORTS.map((c) => ({ label: c.label, tier: c.tier, hours: c.hours, summary: '', courses: c.courses.map((l, i) => ({ label: l, color: [c.color, C.accent, '#916d03', '#03819b'][i % 4] })) })),
];
export const OTHER_SUMMARIES: Record<string, string> = {
  'Growth Machine': 'Marketing, analytics, market research, and personal brand — the full stack for someone who owns growth end to end.',
  'AI-Native Builder': 'Core AI fluency, prompt engineering, no-code automation, and RAG systems — the toolkit for building with AI.',
  'Influence & Close': 'The psychology, sales process, negotiation, and executive communication behind every high-stakes conversation.',
};

export const MarketplaceCohorts: React.FC<{ press?: number }> = ({ press = 0 }) => (
  <div style={{ padding: '28px 36px', fontFamily: F.display }}>
    <div style={{ fontSize: 34, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em' }}>Marketplace</div>
    <div style={{ display: 'flex', gap: 8, margin: '14px 0 22px' }}>
      {['Courses', 'Cohorts'].map((t) => (
        <span key={t} style={{ borderRadius: 6, border: `2px solid ${C.ink}`, padding: '6px 16px', fontWeight: 800, fontSize: 15, background: t === 'Cohorts' ? C.ink : C.paper2, color: t === 'Cohorts' ? C.paper : C.ink }}>{t}</span>
      ))}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {COHORT_CARDS.map((c, i) => (
        <CohortCard key={c.label} {...c} summary={c.summary || OTHER_SUMMARIES[c.label]} press={i === 0 ? press : 0} />
      ))}
    </div>
  </div>
);
/** Screen px centre of the first cohort card. */
export const COHORT_CARD_CENTRE = { x: SIDEBAR_W + 36 + (1440 - SIDEBAR_W - 72 - 20) / 4, y: BROWSER_BAR + 28 + 41 + 14 + 38 + 22 + 150 };

export const CohortDetail: React.FC<{ enrollPress?: number; enrolled?: boolean; pops?: number[] }> = ({ enrollPress = 0, enrolled = false, pops = [] }) => (
  <div style={{ padding: '26px 36px', fontFamily: F.display }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: C.ink3, marginBottom: 8 }}>← Marketplace · Cohorts</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em' }}>{COHORT.label}</div>
      <TierBadge tier={COHORT.tier} />
    </div>
    <div style={{ marginTop: 8, fontSize: 16, lineHeight: 1.5, color: C.ink2, maxWidth: 820 }}>{COHORT.summary}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
      <div style={{ height: 46, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 6, border: `2px solid ${C.ink}`, background: enrolled ? C.paper2 : C.accent, color: enrolled ? C.ink : '#fff', fontWeight: 900, fontSize: 16, ...pressStyle(4, enrollPress) }}>
        {enrolled ? (<>Enrolled ✓</>) : 'Enroll in cohort'}
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, color: C.ink3 }}>{COHORT.hours}h · {COHORT.courses.length} courses, in order</span>
    </div>
    <div style={{ position: 'relative', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ position: 'absolute', left: 21, top: 20, bottom: 20, width: 5, background: C.ink }} />
      {COHORT.courses.map((c, i) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', scale: `${1 + 0.05 * (pops[i] ?? 0)}` }}>
          <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 99, border: `3px solid ${C.ink}`, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.mono, fontWeight: 700, fontSize: 18, zIndex: 1 }}>{i + 1}</div>
          <div style={{ flex: 1, maxWidth: 760, height: 52, borderRadius: 6, border: `2px solid ${C.ink}`, background: c.color, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', boxShadow: shadow(3) }}>
            <span style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>{c.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.85 }}>{c.topics} topics</span>
            <ArrowRight size={16} />
          </div>
        </div>
      ))}
    </div>
  </div>
);
export const ENROLL_BTN = { x: SIDEBAR_W + 36 + 100, y: BROWSER_BAR + 26 + 21 + 44 + 8 + 48 + 16 + 23 };

// ---- resume editor (desktop split: editor | preview) ----------------------------------------------------
const SECTIONS = ['Header', 'Education', 'Experience', 'Projects', 'Skills', 'Awards'];

export const EditorColumn: React.FC<{ entries: string[]; newCount: number; pops: number[]; addPress?: number }> = ({ entries, newCount, pops, addPress = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F.display }}>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {SECTIONS.map((s) => (
        <span key={s} style={{ borderRadius: 4, border: `2px solid ${C.ink}`, padding: '4px 10px', fontSize: 12, fontWeight: 800, background: s === 'Skills' ? C.ink : C.paper2, color: s === 'Skills' ? C.paper : C.ink2 }}>{s}</span>
      ))}
    </div>
    <div style={{ borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper2, padding: 20, boxShadow: shadow(4) }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>Skills</div>
      <div style={{ fontSize: 13, color: C.ink2, marginTop: 4 }}>Tools and methods you can actually use on the job.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
        <div style={{ height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 13, ...pressStyle(4, addPress) }}>
          <Plus size={14} /> Add from UpForge
        </div>
        <span style={{ fontSize: 12, color: C.ink3 }}>{newCount} unlocked skill{newCount === 1 ? '' : 's'} not yet added</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((e, i) => (
          <div key={e} style={{ height: 38, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14, fontWeight: 700, color: C.ink, scale: `${1 + 0.05 * (pops[i] ?? 0)}` }}>{e}</div>
        ))}
      </div>
    </div>
  </div>
);
export const ADD_BTN = { x: 36 + 20 + 80, y: 26 + 34 + 14 + 20 + 26 + 20 + 16 + 14 + 16 - 34 };

// ---- the resume's skill picker, grouped by skill domain like the app's, multi-select ----------------
export const GroupPicker: React.FC<{ groups: { domain: string; color: string; names: string[] }[]; selected: string[]; confirmPress?: number; pops?: Record<string, number> }> = ({ groups, selected, confirmPress = 0, pops = {} }) => (
  <div style={{ width: 400, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(8), fontFamily: F.display }}>
    <div style={{ borderBottom: `2px solid ${C.ink}`, padding: '12px 20px' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Add skills you&apos;ve unlocked</div>
      <div style={{ fontSize: 11, color: C.ink3 }}>These are added as plain text — editing them later won&apos;t change your courses.</div>
    </div>
    <div style={{ padding: '14px 20px' }}>
      {groups.map((g) => (
        <div key={g.domain} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${C.ink}`, background: g.color }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, textTransform: 'capitalize' }}>{g.domain}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {g.names.map((s) => {
              const on = selected.includes(s);
              return (
                <span key={s} style={{ borderRadius: 4, border: `2px solid ${C.ink}`, padding: '6px 10px', fontSize: 12, fontWeight: 800, background: on ? g.color : C.paper2, color: on ? '#fff' : C.ink, scale: `${1 + 0.08 * (pops[s] ?? 0)}` }}>{s}</span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.ink}`, padding: '12px 20px' }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: C.ink3 }}>{selected.length} selected</span>
      <div style={{ height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 800, opacity: selected.length ? 1 : 0.5, ...pressStyle(4, confirmPress) }}>
        Add {selected.length || ''} to resume
      </div>
    </div>
  </div>
);
