// The app's screens rebuilt as pure components (props in, pixels out; no hooks, no timers).
// Authored in the app's own CSS px and classes' values; acts show them through UI_ZOOM.
import { ArrowRight, CheckCircle2, ChevronRight, Circle, X, Zap } from 'lucide-react';
import { ClockMark, SignalMark, SparkMark, StreakMark, CheckCircleMark, LockMark } from './icons/glyphs';
import { VideoMark, ArticleMark } from './icons/formats';
import { ExcelMark } from './icons/domains';
import { LEVEL_ICONS } from './icons/levels';
import { ICONS, FALLBACK_ICON } from './icons';
import type { Course, Resource } from './data';
import { levelFor, LEVELS } from './data';
import { C, F, shadow } from './theme';

export type Status = 'todo' | 'next' | 'active' | 'done';

const STATE: Record<Status, { bg: string; ink: string; label: string }> = {
  done: { bg: C.done, ink: '#ffffff', label: 'Done' },
  active: { bg: C.active, ink: '#ffffff', label: 'In Progress' },
  next: { bg: C.next, ink: C.ink, label: 'Up Next' },
  todo: { bg: C.paper2, ink: C.ink2, label: 'To Do' },
};

/** The app's press: an element at rest sits `offset` px from its hard shadow; press p (0..1) moves it into the shadow. */
export const pressStyle = (offset: number, p = 0, lift = 0): React.CSSProperties => {
  const d = offset * p - lift;
  const s = offset - offset * p + lift;
  return { transform: `translate(${d}px, ${d}px)`, boxShadow: shadow(Math.max(0, s)) };
};

// ---- marketplace ---------------------------------------------------------------------------------
const TIER: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  foundational: { bg: C.successSoft, fg: C.success, border: C.success, label: 'Foundational' },
  intermediate: { bg: C.accentSoft, fg: C.accent, border: C.accent, label: 'Intermediate' },
  advanced: { bg: C.ink, fg: C.paper, border: C.ink, label: 'Advanced' },
};

export const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const t = TIER[tier] ?? TIER.foundational;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 4, border: `2px solid ${t.border}`, background: t.bg, color: t.fg, padding: '3px 9px', fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {t.label}
    </span>
  );
};

export const EnrollButton: React.FC<{ enrolled: boolean; press?: number }> = ({ enrolled, press = 0 }) => (
  <div
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px', borderRadius: 6,
      border: `2px solid ${C.ink}`, fontSize: 14, fontWeight: 800,
      background: enrolled ? C.paper2 : C.accent, color: enrolled ? C.ink : C.accentInk,
      ...pressStyle(4, press),
    }}
  >
    {enrolled ? (<>Continue <ArrowRight size={15} strokeWidth={2.5} /></>) : 'Enroll'}
  </div>
);

/** Fixed height so the camera and the tap cursor can target it by coordinates. */
export const CARD_H = 256;

export const CourseCard: React.FC<{ course: Course; enrolled?: boolean; enrollPress?: number; press?: number }> = ({ course, enrolled = false, enrollPress = 0, press = 0 }) => {
  const Icon = ICONS[course.iconKey ?? course.id] ?? FALLBACK_ICON;
  return (
  <div
    style={{
      width: 400, height: CARD_H, boxSizing: 'border-box', borderRadius: 10, border: `2px solid ${C.ink}`, background: course.color, color: '#fff', padding: 22,
      display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F.display, ...pressStyle(6, press),
    }}
  >
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper2, color: course.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>{course.label}</div>
        <TierBadge tier={course.tier} />
      </div>
    </div>
    <div style={{ fontSize: 14, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{course.summary}</div>
    <div style={{ display: 'flex', gap: 16, fontSize: 12, alignItems: 'center', marginTop: 'auto' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ClockMark size={13} /> {course.hours}h total</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SignalMark size={13} /> {course.effort}/week</span>
      <span>{course.topics} topics</span>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 800, textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4 }}>View syllabus</span>
      <EnrollButton enrolled={enrolled} press={enrollPress} />
    </div>
  </div>
  );
};

// ---- topic + resources ---------------------------------------------------------------------------
const ROW_ICON: Record<Status, React.FC<{ size: number; strokeWidth?: number }>> = { done: CheckCircle2, active: Zap, next: ArrowRight, todo: Circle };
export const ROW_H = 72;

export const TopicRow: React.FC<{ title: string; status: Status; done: number; total: number; pop?: number }> = ({ title, status, done, total, pop = 0 }) => {
  const s = STATE[status];
  const Icon = ROW_ICON[status];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', height: ROW_H, boxSizing: 'border-box', borderRadius: 6, border: `2px solid ${C.ink}`,
        background: s.bg, color: s.ink, boxShadow: shadow(3), fontFamily: F.display, transform: `scale(${1 + 0.04 * pop})`,
      }}
    >
      <Icon size={18} strokeWidth={2.25} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{done}/{total} resources</div>
        {status !== 'done' && (
          <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.12)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: 'currentColor' }} />
          </div>
        )}
      </div>
      {/* The status pill is `hidden sm:inline-block` in the app, so at phone width it isn't shown. */}
      <ChevronRight size={16} style={{ opacity: 0.6 }} />
    </div>
  );
};

export type ResStatus = 'todo' | 'in_progress' | 'done';
const RES: Record<ResStatus, { bg: string; ink: string }> = {
  done: { bg: C.done, ink: '#fff' },
  in_progress: { bg: C.active, ink: '#fff' },
  todo: { bg: C.paper2, ink: C.ink2 },
};

export const ResourceCard: React.FC<{ r: Resource; status: ResStatus; press?: number; pop?: number }> = ({ r, status, press = 0, pop = 0 }) => {
  const s = RES[status];
  const Icon = r.action === 'Watch' ? VideoMark : ArticleMark;
  const lit = status !== 'todo';
  return (
    <div
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16, borderRadius: 6, border: `2px solid ${C.ink}`,
        background: s.bg, color: s.ink, fontFamily: F.display, ...pressStyle(3, press), scale: `${1 + 0.035 * pop}`,
      }}
    >
      <Icon size={20} strokeWidth={1.75} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>{r.title}</span>
          {status === 'done' ? <CheckCircleMark size={16} strokeWidth={2} /> : <ChevronRight size={16} style={{ opacity: 0.6 }} />}
        </div>
        <div style={{ marginTop: 3, fontSize: 12, opacity: 0.75 }}>{r.meta}</div>
      </div>
      <span style={{ flexShrink: 0, borderRadius: 4, border: `2px solid ${lit ? 'currentColor' : C.ink}`, color: lit ? 'inherit' : C.ink2, padding: '3px 8px', fontSize: 11, fontWeight: 800 }}>
        {r.action}
      </span>
    </div>
  );
};

export const TopicHeader: React.FC<{ status: Status; done: number; total: number }> = ({ status, done, total }) => {
  const s = STATE[status];
  const label = status === 'done' ? 'Completed' : status === 'active' ? 'In progress' : status === 'next' ? 'Up next' : 'Not started';
  const Icon = ROW_ICON[status];
  return (
    <div style={{ borderRadius: 6, border: `2px solid ${C.ink}`, padding: 16, background: s.bg, color: s.ink, boxShadow: shadow(4), fontFamily: F.display }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={18} strokeWidth={2.25} />
        <span style={{ fontWeight: 800, fontSize: 16 }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{done} of {total} resources</span>
      </div>
      <div style={{ marginTop: 10, height: 8, borderRadius: 3, border: '2px solid currentColor', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: 'currentColor' }} />
      </div>
    </div>
  );
};

// ---- course banner ---------------------------------------------------------------------------------
export const CourseBanner: React.FC<{ done: number; active: number; total: number; color: string }> = ({ done, active, total, color }) => {
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{ borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper, padding: 20, boxShadow: shadow(4), fontFamily: F.display }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 46, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
          <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink3 }}>complete</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <Chip border={C.success} bg={C.successSoft} fg={C.success} icon={<CheckCircle2 size={13} />}>{done} done</Chip>
          <Chip border={color} bg="transparent" fg={color} icon={<Zap size={13} />}>{active} in progress</Chip>
          <Chip border={C.ink} bg={C.paper2} fg={C.ink3} icon={<Circle size={13} />}>{total - done - active} to do</Chip>
        </div>
      </div>
      <div style={{ display: 'flex', height: 20, borderRadius: 4, border: `2px solid ${C.ink}`, background: C.paper2, overflow: 'hidden' }}>
        <div style={{ width: `${(done / total) * 100}%`, background: C.success }} />
        <div style={{ width: `${(active / total) * 100}%`, background: color, opacity: 0.7 }} />
      </div>
    </div>
  );
};

const Chip: React.FC<{ border: string; bg: string; fg: string; icon: React.ReactNode; children: React.ReactNode }> = ({ border, bg, fg, icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4, border: `2px solid ${border}`, background: bg, color: fg, padding: '5px 11px', fontSize: 12, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
    {icon}{children}
  </div>
);

// ---- XP widget -----------------------------------------------------------------------------------
export const XPWidget: React.FC<{ xp: number; streak: number; pop?: number }> = ({ xp, streak, pop = 0 }) => {
  const level = levelFor(xp);
  const idx = LEVELS.indexOf(level);
  const next = LEVELS[idx + 1];
  const pct = next ? Math.min(100, Math.round(((xp - level.min) / (next.min - level.min)) * 100)) : 100;
  const LevelIcon = LEVEL_ICONS[idx];
  return (
    <div style={{ width: 300, overflow: 'hidden', borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper, boxShadow: shadow(4), fontFamily: F.display, scale: `${1 + 0.05 * pop}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${C.ink}`, background: C.accent, padding: '8px 12px', color: C.accentInk }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LevelIcon size={18} />
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{level.label}</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
          {xp.toLocaleString('en-US')}<span style={{ marginLeft: 4, fontSize: 10, fontWeight: 600, opacity: 0.75 }}>XP</span>
        </span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.ink2 }}>{level.name}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: C.ink }}>
            <StreakMark size={13} style={{ color: C.accent }} /> {streak}d streak
          </span>
        </div>
        <div style={{ position: 'relative', height: 10, borderRadius: 3, border: `2px solid ${C.ink}`, background: C.paper3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: C.accent }} />
        </div>
        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 500, color: C.ink3 }}>
          {next ? `${(next.min - xp).toLocaleString('en-US')} XP to ${next.label}` : ''}
        </div>
      </div>
    </div>
  );
};

// ---- skill unlock --------------------------------------------------------------------------------
export const SkillUnlock: React.FC<{ name: string; domain: string; description: string; xp: number; unlocked: boolean; badgeScale?: number; showXp?: boolean }> = ({ name, domain, description, xp, unlocked, badgeScale = 1, showXp = true }) => (
  <div style={{ width: 384, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper, padding: 32, textAlign: 'center', boxShadow: shadow(6), fontFamily: F.display }}>
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: unlocked ? C.accent : C.ink3 }}>{unlocked ? 'Skill unlocked' : '1 resource to go'}</div>
    <div
      style={{
        width: 80, height: 80, borderRadius: 99, border: `2px solid ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: unlocked ? C.excel : C.paper3, color: unlocked ? '#fff' : C.ink3, scale: `${badgeScale}`,
      }}
    >
      {unlocked ? <ExcelMark size={40} strokeWidth={1.75} /> : <LockMark size={36} strokeWidth={1.75} />}
    </div>
    <div style={{ fontSize: 20, fontWeight: 800, color: unlocked ? C.ink : C.ink3 }}>{name}</div>
    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.ink3 }}>{domain}</div>
    <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink2, opacity: unlocked ? 1 : 0.5 }}>{description}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4, border: `2px solid ${C.ink}`, background: C.paper3, padding: '6px 12px', fontSize: 14, fontWeight: 800, color: C.ink, opacity: showXp ? 1 : 0 }}>
      <SparkMark size={15} style={{ color: C.accent }} /> +{xp} XP
    </div>
    <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800, color: C.ink2, textDecoration: 'underline', textDecorationThickness: 2, textUnderlineOffset: 4, opacity: unlocked ? 1 : 0 }}>Nice, continue</div>
  </div>
);

// ---- resume skill picker ---------------------------------------------------------------------------
export const SkillPicker: React.FC<{ skills: string[]; selected: string | null; press?: number; confirmPress?: number }> = ({ skills, selected, press = 0, confirmPress = 0 }) => (
  <div style={{ width: 400, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(8), fontFamily: F.display }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${C.ink}`, padding: '12px 20px' }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Add skills you&apos;ve unlocked</div>
        <div style={{ fontSize: 11, color: C.ink3 }}>These are added as plain text.</div>
      </div>
      <div style={{ borderRadius: 99, border: `2px solid ${C.ink}`, background: C.paper, padding: 5, display: 'flex' }}><X size={15} /></div>
    </div>
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${C.ink}`, background: C.excel }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>Excel</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {skills.map((s) => {
          const on = s === selected;
          return (
            <span
              key={s}
              style={{
                borderRadius: 4, border: `2px solid ${C.ink}`, padding: '6px 10px', fontSize: 12, fontWeight: 800,
                background: on ? C.excel : C.paper2, color: on ? '#fff' : C.ink, ...pressStyle(4, on ? press : 0),
              }}
            >
              {s}
            </span>
          );
        })}
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `2px solid ${C.ink}`, padding: '12px 20px' }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: C.ink3 }}>{selected ? 1 : 0} selected</span>
      <div style={{ height: 40, padding: '0 16px', display: 'flex', alignItems: 'center', borderRadius: 6, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontSize: 14, fontWeight: 800, opacity: selected ? 1 : 0.5, ...pressStyle(4, confirmPress) }}>
        Add {selected ? 1 : ''} to resume
      </div>
    </div>
  </div>
);

// ---- resume page (a document, not app chrome: fixed black on white, like the app's preview) ------
const R = { paper: '#ffffff', ink: '#111111', muted: '#444444', shade: '#d9d9d9', soft: '#efefef' };
const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ margin: '12px 0 4px', padding: '3px 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: R.ink, background: R.shade, border: `1px solid ${R.ink}` }}>{children}</div>
);

export const ResumePage: React.FC<{ skills: string[]; landing?: React.ReactNode; flash?: number }> = ({ skills, landing, flash = 0 }) => (
  <div style={{ width: 400, boxSizing: 'border-box', background: R.paper, color: R.ink, padding: 26, fontFamily: 'Arial, Helvetica, sans-serif', border: `2px solid ${C.ink}`, boxShadow: shadow(6) }}>
    <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>MEERA IYER</div>
    <div style={{ textAlign: 'center', fontSize: 8.5, color: R.muted, marginTop: 3 }}>+91 98XXX XXXXX  |  meera.iyer@example.com  |  linkedin.com/in/meera-iyer</div>
    <Heading>Education</Heading>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
      <tbody>
        <tr>{['Degree', 'Institute/School', 'CGPA/Grade', 'Year'].map((h) => <td key={h} style={{ border: `1px solid ${R.ink}`, background: R.shade, padding: '2px 5px', fontWeight: 700 }}>{h}</td>)}</tr>
        <tr>{['B.Com (Hons)', 'University of Delhi', '8.4', '2024'].map((h) => <td key={h} style={{ border: `1px solid ${R.ink}`, padding: '2px 5px' }}>{h}</td>)}</tr>
      </tbody>
    </table>
    <Heading>Work experience</Heading>
    <div style={{ display: 'flex', gap: 14, fontSize: 10, borderBottom: `1px solid ${R.soft}`, paddingBottom: 4 }}>
      <div style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 700 }}>Northwind Consulting</div>
        <div style={{ color: R.muted }}>Business Analyst</div>
        <div style={{ color: R.muted }}>2024 – Present</div>
      </div>
      <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.45 }}>
        <li>Built weekly KPI dashboards for 3 client engagements</li>
        <li>Cut month-end reporting time by 30% with templated models</li>
      </ul>
    </div>
    <Heading>Skills</Heading>
    <div style={{ position: 'relative', fontSize: 10.5, lineHeight: 1.6, minHeight: 34 }}>
      {skills.map((s, i) => {
        const isNew = i === skills.length - 1 && flash > 0;
        return (
          <span key={s}>
            {i > 0 && ' · '}
            <span style={{ background: isNew ? `rgba(255, 216, 61, ${flash})` : 'transparent', fontWeight: isNew ? 700 : 400 }}>{s}</span>
          </span>
        );
      })}
      {landing}
    </div>
  </div>
);

// ---- toast (the app's: ink pill, paper border, bottom centre) -----------------------------------
export const Toast: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ borderRadius: 6, border: `2px solid ${C.paper}`, background: C.ink, color: C.paper, padding: '10px 20px', fontSize: 14, fontWeight: 800, boxShadow: shadow(6), fontFamily: F.display, whiteSpace: 'nowrap' }}>{text}</div>
);

// ---- skills page (one course group, open) ---------------------------------------------------------
export const SkillGroupHeader: React.FC<{ label: string; count: string; pct: number }> = ({ label, count, pct }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.paper2, padding: '12px 16px', border: `2px solid ${C.ink}`, borderBottomWidth: 0, borderRadius: '6px 6px 0 0', fontFamily: F.display }}>
    <span style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${C.ink}`, background: C.accent }} />
    <span style={{ flex: 1, fontWeight: 800, fontSize: 16, color: C.ink }}>{label}</span>
    <span style={{ borderRadius: 4, border: `2px solid ${C.ink}`, background: C.paper, padding: '2px 8px', fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    <span style={{ width: 80, height: 12, borderRadius: 3, border: `2px solid ${C.ink}`, background: C.paper3, overflow: 'hidden' }}>
      <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: C.accent }} />
    </span>
  </div>
);

export const SkillTile: React.FC<{ name: string; press?: number; pop?: number }> = ({ name, press = 0, pop = 0 }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderRadius: 6, border: `2px solid ${C.ink}`, background: C.excel, color: '#fff', padding: 14, fontFamily: F.display, ...pressStyle(2, press), scale: `${1 + 0.04 * pop}` }}>
    <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.paper2, color: C.excel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ExcelMark size={20} strokeWidth={1.75} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>{name}</span>
        <TierBadge tier="foundational" />
      </div>
      <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 12, fontWeight: 600 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircleMark size={13} /> Unlocked</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.75 }}><SparkMark size={12} /> 60 XP</span>
      </div>
    </div>
  </div>
);
