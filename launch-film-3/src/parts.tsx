// Set pieces and type for "The Climb". Pure components: props in, pixels out.
import { Download, Send, SignalHigh, Wifi, BatteryFull } from 'lucide-react';
import { PlayMark, CheckCircleMark, ClockMark, SparkMark } from './icons/glyphs';
import { ArticleMark } from './icons/formats';
import { ExcelMark } from './icons/domains';
import { E, hitPulse, prog } from './lib/anim';
import { C, F, shadow } from './theme';
import { TierBadge } from './ui';

// ---- type ---------------------------------------------------------------------------------------------
export const WIPE_IN = 10; // frames for the block to cover the line; the line is "hit" on this frame
const WIPE_OUT = 12;

/** A solid block sweeps across, the line appears under it, and the block retracts off the far side. */
export const Wipe: React.FC<{ t: number; bar?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ t, bar = C.ink, children, style }) => {
  if (t < 0) return null;
  const inK = prog(t, 0, WIPE_IN, E.wipe);
  const outK = prog(t, WIPE_IN, WIPE_IN + WIPE_OUT, E.wipe);
  const showText = t >= WIPE_IN;
  const barOn = outK < 1;
  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      <div style={{ visibility: showText ? 'visible' : 'hidden' }}>{children}</div>
      {barOn && (
        <div
          style={{
            position: 'absolute', left: -6, right: -6, top: '6%', bottom: '2%', background: bar,
            transformOrigin: showText ? '100% 50%' : '0% 50%', transform: `scaleX(${showText ? 1 - outK : inK})`,
          }}
        />
      )}
    </div>
  );
};

export const Headline: React.FC<{ children: React.ReactNode; size?: number; color?: string; width?: number }> = ({ children, size = 96, color = C.ink, width }) => (
  <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.03em', color, width, whiteSpace: 'nowrap' }}>{children}</div>
);

/** "STEP 0n" chip: drops a few px onto its line with a hard shadow. */
export const StepChip: React.FC<{ n: number; t: number; dark?: boolean }> = ({ n, t, dark }) => {
  if (t < -6) return null;
  const k = prog(t, -6, 0, E.fall);
  const lift = (1 - k) * -26 + (t >= 0 ? -3 * hitPulse(t, 1, 4) : 0);
  const bg = dark ? C.login : C.ink;
  const fg = dark ? C.ink : C.paper;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, height: 54, padding: '0 18px', borderRadius: 8, border: `3px solid ${dark ? C.paper : C.ink}`, background: bg, color: fg, fontFamily: F.mono, fontWeight: 700, fontSize: 26, letterSpacing: '0.06em', transform: `translate(0px, ${lift}px)`, opacity: Math.min(1, k * 2), boxShadow: shadow(5, dark ? C.paper : C.accent) }}>
      STEP {String(n).padStart(2, '0')}
      <span style={{ opacity: 0.55 }}>/ 05</span>
    </div>
  );
};

/** Chip, then the headline wipes in on the next beat, then an optional mono sub-line. */
export const StepTitle: React.FC<{ n: number; t: number; line: string; sub?: string; subT?: number; x: number; y: number; dark?: boolean; size?: number; bar?: string; width?: number }> = ({ n, t, line, sub, subT = 999, x, y, dark, size = 96, bar = C.accent, width }) => (
  <div style={{ position: 'absolute', left: x, top: y, width }}>
    <StepChip n={n} t={t} dark={dark} />
    <div style={{ marginTop: 22 }}>
      <Wipe t={t - 19} bar={bar}>
        <Headline size={size} color={dark ? C.paper : C.ink}>{line}</Headline>
      </Wipe>
    </div>
    {sub && (
      <div style={{ marginTop: 22 }}>
        <Wipe t={t - subT} bar={dark ? C.paper : C.ink}>
          <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 30, color: dark ? C.paper : C.ink2, whiteSpace: 'nowrap' }}>{sub}</div>
        </Wipe>
      </div>
    )}
  </div>
);

// ---- the logo -----------------------------------------------------------------------------------------
/** The UF tile exactly as the app draws it (login brand panel / sidebar): blue, ink border, hard shadow. */
export const Tile: React.FC<{ size: number; lift?: number; squash?: number }> = ({ size, lift = 0, squash = 0 }) => (
  <div
    style={{
      width: size, height: size, boxSizing: 'border-box', borderRadius: size * 0.125, border: `${Math.max(3, size * 0.04)}px solid ${C.ink}`,
      background: C.accent, color: C.accentInk, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F.display, fontWeight: 800, fontSize: size * 0.4, letterSpacing: '-0.02em',
      boxShadow: shadow(Math.round(size * 0.06 + lift)), transform: `translate(${-lift}px, ${-lift}px) scale(${1 + squash * 0.5}, ${1 - squash})`, transformOrigin: '50% 100%',
    }}
  >
    UF
  </div>
);

// ---- the heap of free resources (generic: no real brands) ----------------------------------------------
export type Junk = { kind: 'video' | 'pdf' | 'list' | 'folder' | 'thread' | 'course' | 'progress'; title: string; meta?: string; w: number; h: number };

export const JunkCard: React.FC<{ j: Junk; grey?: number; stamp?: number }> = ({ j, grey = 0, stamp = -1 }) => {
  const base: React.CSSProperties = { width: j.w, height: j.h, boxSizing: 'border-box', borderRadius: 10, border: `3px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(6), fontFamily: F.display, overflow: 'hidden', position: 'relative' };
  if (j.kind === 'video')
    return (
      <div style={base}>
        <div style={{ height: j.h - 62, background: '#1c1c1c', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 64, height: 44, borderRadius: 10, background: '#e0182d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayMark size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ position: 'absolute', right: 8, bottom: 8, background: '#000', color: '#fff', fontSize: 13, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: F.mono }}>{j.meta}</div>
          <div style={{ position: 'absolute', left: 0, bottom: 0, height: 5, width: '14%', background: '#e0182d' }} />
        </div>
        <div style={{ padding: '8px 12px', fontSize: 16, fontWeight: 800, lineHeight: 1.15, color: C.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
      </div>
    );
  if (j.kind === 'pdf')
    return (
      <div style={{ ...base, padding: 16 }}>
        <div style={{ position: 'absolute', right: 0, top: 0, background: '#c9352b', color: '#fff', fontFamily: F.mono, fontWeight: 700, fontSize: 15, padding: '4px 10px', borderBottomLeftRadius: 8, borderLeft: `3px solid ${C.ink}`, borderBottom: `3px solid ${C.ink}` }}>PDF</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginTop: 30, marginBottom: 12, lineHeight: 1.2, wordBreak: 'break-all' }}>{j.title}</div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ height: 8, width: `${55 + ((i * 29) % 40)}%`, background: C.ink3, opacity: 0.3, borderRadius: 2, marginBottom: 9 }} />
        ))}
      </div>
    );
  if (j.kind === 'list' || j.kind === 'course')
    return (
      <div style={{ ...base, padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.ink, lineHeight: 1.15, marginBottom: 10 }}>{j.title}</div>
        {(j.kind === 'list' ? ['1.', '2.', '3.', '4.'] : ['Module 1', 'Module 2', 'Module 3 · locked']).map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: C.ink2, whiteSpace: 'nowrap' }}>{m}</span>
            <span style={{ flex: 1, height: 8, background: C.ink3, opacity: 0.3, borderRadius: 2 }} />
          </div>
        ))}
      </div>
    );
  if (j.kind === 'folder')
    return (
      <div style={{ ...base, background: C.next, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ position: 'absolute', left: -3, top: -3, width: 110, height: 26, background: C.next, border: `3px solid ${C.ink}`, borderRadius: '10px 10px 0 0' }} />
        <div style={{ fontSize: 13, fontFamily: F.mono, fontWeight: 700, color: C.ink, marginTop: 20 }}>BOOKMARKS</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.ink, lineHeight: 1.1 }}>{j.title}</div>
        <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: C.ink }}>{j.meta}</div>
      </div>
    );
  if (j.kind === 'thread')
    return (
      <div style={{ ...base, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 99, background: C.ink3, border: `2px solid ${C.ink}` }} />
          <span style={{ height: 10, width: 110, background: C.ink3, opacity: 0.4, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{j.title}</div>
        <div style={{ marginTop: 8, fontFamily: F.mono, fontSize: 13, color: C.ink3, fontWeight: 700 }}>{j.meta}</div>
      </div>
    );
  // progress: the one that tells the story, greyed and stamped
  return (
    <div style={{ ...base, padding: '14px 18px', filter: `grayscale(${grey})` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: C.ink }}>{j.title}</span>
        <span style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: C.accent }}>12%</span>
      </div>
      <div style={{ marginTop: 12, height: 18, borderRadius: 4, border: `3px solid ${C.ink}`, background: C.paper3, overflow: 'hidden' }}>
        <div style={{ width: '12%', height: '100%', background: C.accent }} />
      </div>
      <div style={{ marginTop: 8, fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: C.ink3 }}>{j.meta}</div>
      {stamp >= 0 && (
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(-9deg) scale(${1 + 0.8 * (1 - prog(stamp, 0, 6, E.fall))})`, opacity: prog(stamp, 0, 3, E.linear), border: `5px solid ${C.ink}`, borderRadius: 8, padding: '4px 16px', background: 'rgba(255,252,245,0.92)', fontFamily: F.mono, fontWeight: 700, fontSize: 34, letterSpacing: '0.08em', color: C.ink, whiteSpace: 'nowrap' }}>
          ABANDONED
        </div>
      )}
    </div>
  );
};

// ---- cohort pass + course cards ------------------------------------------------------------------------
export const PassCard: React.FC<{ label: string; hours: number; courses: { label: string; color: string }[]; stamp?: number }> = ({ label, hours, courses, stamp = -1 }) => (
  <div style={{ width: 620, height: 330, display: 'flex', borderRadius: 16, border: `4px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(12), fontFamily: F.display, position: 'relative' }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 58, background: C.accent, borderBottom: `4px solid ${C.ink}`, borderRadius: '12px 0 0 0', display: 'flex', alignItems: 'center', padding: '0 24px', color: '#fff', fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.12em' }}>COHORT PASS</div>
      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1.05 }}>{label}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ zoom: 1.35 }}><TierBadge tier="foundational" /></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 19, fontWeight: 700, color: C.ink2 }}><ClockMark size={18} /> {hours}h · {courses.length} courses</span>
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', height: 18, borderRadius: 4, border: `3px solid ${C.ink}`, overflow: 'hidden' }}>
          {courses.map((c) => <span key={c.label} style={{ flex: 1, background: c.color }} />)}
        </div>
      </div>
    </div>
    <div style={{ width: 112, borderLeft: `4px dashed ${C.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.paper3, borderRadius: '0 12px 12px 0' }}>
      <div style={{ transform: 'rotate(90deg)', fontFamily: F.mono, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', whiteSpace: 'nowrap', color: C.ink }}>ADMIT ONE</div>
    </div>
    {stamp >= 0 && (
      <div style={{ position: 'absolute', left: 250, top: 150, transform: `rotate(-10deg) scale(${1 + 0.9 * (1 - prog(stamp, 0, 7, E.fall))})`, opacity: prog(stamp, 0, 3, E.linear), display: 'flex', alignItems: 'center', gap: 10, border: `6px solid ${C.success}`, borderRadius: 10, padding: '6px 18px', background: 'rgba(198,246,213,0.94)', fontFamily: F.mono, fontWeight: 700, fontSize: 40, letterSpacing: '0.08em', color: C.success, whiteSpace: 'nowrap' }}>
        <CheckCircleMark size={36} strokeWidth={2.5} /> ENROLLED
      </div>
    )}
  </div>
);

export const FanCard: React.FC<{ n: number; label: string; tier: string; topics: number; color: string }> = ({ n, label, tier, topics, color }) => (
  <div style={{ width: 230, height: 300, boxSizing: 'border-box', borderRadius: 12, border: `4px solid ${C.ink}`, background: color, color: '#fff', padding: 18, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: F.display, boxShadow: shadow(6) }}>
    <div style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 18, opacity: 0.85 }}>COURSE {n}</div>
    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1 }}>{label}</div>
    <div style={{ marginTop: 'auto', fontSize: 16, fontWeight: 700 }}>{topics} topics</div>
    <span style={{ alignSelf: 'flex-start' }}><TierBadge tier={tier} /></span>
  </div>
);

// ---- desk props ---------------------------------------------------------------------------------------
export const Mug: React.FC<{ steam: number }> = ({ steam }) => (
  <div style={{ position: 'relative', width: 170, height: 190 }}>
    {[0, 1, 2].map((i) => {
      const ph = (steam / 50 + i / 3) % 1;
      return <div key={i} style={{ position: 'absolute', left: 40 + i * 30, top: 30 - ph * 60, width: 10, height: 44, borderRadius: 99, border: `4px solid ${C.ink3}`, borderLeft: 'none', borderBottom: 'none', opacity: Math.sin(ph * Math.PI) * 0.6 }} />;
    })}
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: 130, height: 120, borderRadius: '8px 8px 22px 22px', border: `4px solid ${C.ink}`, background: C.next, boxShadow: shadow(6), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.display, fontWeight: 800, fontSize: 30, color: C.ink }}>UF</div>
    <div style={{ position: 'absolute', left: 122, bottom: 30, width: 44, height: 56, borderRadius: '0 22px 22px 0', border: `4px solid ${C.ink}`, borderLeft: 'none' }} />
  </div>
);

export const Plant: React.FC<{ sway: number }> = ({ sway }) => (
  <div style={{ position: 'relative', width: 150, height: 260 }}>
    {[-28, 0, 26].map((a, i) => (
      <div key={i} style={{ position: 'absolute', left: 60, bottom: 100, width: 34, height: 150 - Math.abs(a) * 1.2, borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%', background: C.success, border: `4px solid ${C.ink}`, transformOrigin: '50% 100%', transform: `rotate(${a + Math.sin(sway / 40 + i) * 2}deg)` }} />
    ))}
    <div style={{ position: 'absolute', left: 20, bottom: 0, width: 110, height: 108, borderRadius: '6px 6px 18px 18px', border: `4px solid ${C.ink}`, background: C.accent, boxShadow: shadow(6) }} />
  </div>
);

// ---- phone ------------------------------------------------------------------------------------------
export const PHONE = { w: 390, h: 800 };
export const Phone: React.FC<{ children: React.ReactNode; banner?: React.ReactNode }> = ({ children, banner }) => (
  <div style={{ width: PHONE.w, height: PHONE.h, boxSizing: 'border-box', borderRadius: 60, background: C.ink, padding: 16, boxShadow: shadow(14) }}>
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 46, background: C.paper, overflow: 'hidden' }}>
      <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', fontFamily: F.display, fontWeight: 800, fontSize: 17, color: C.ink }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 6 }}><SignalHigh size={17} /><Wifi size={17} /><BatteryFull size={19} /></span>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 12, width: 110, height: 30, marginLeft: -55, borderRadius: 99, background: C.ink }} />
      {children}
      {banner}
    </div>
  </div>
);

export const Notif: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, border: `3px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(4), fontFamily: F.display }}>
    <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: `2px solid ${C.ink}`, background: C.accent, color: '#fff', fontWeight: 800, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>UF</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>{title}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink2, lineHeight: 1.25 }}>{body}</div>
    </div>
  </div>
);

// ---- skill tile (the app's /skills tile, larger) ---------------------------------------------------------
export const SkillBadge: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ width: 640, display: 'flex', gap: 18, alignItems: 'center', borderRadius: 10, border: `4px solid ${C.ink}`, background: C.excel, color: '#fff', padding: '16px 20px', fontFamily: F.display, boxShadow: shadow(7), boxSizing: 'border-box' }}>
    <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 10, border: `3px solid ${C.ink}`, background: C.paper2, color: C.excel, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ExcelMark size={32} strokeWidth={1.75} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 25, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      <div style={{ marginTop: 6, display: 'flex', gap: 16, fontSize: 17, fontWeight: 700 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircleMark size={17} /> Unlocked</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85 }}><SparkMark size={16} /> +60 XP</span>
      </div>
    </div>
  </div>
);

// ---- resume builder --------------------------------------------------------------------------------------
/** The app's "Add skills you've unlocked" picker with several chips selected. */
export const SkillPickerMulti: React.FC<{ skills: string[]; gone: boolean[]; confirm?: number }> = ({ skills, gone, confirm = 0 }) => (
  <div style={{ width: 620, borderRadius: 10, border: `4px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(12), fontFamily: F.display }}>
    <div style={{ borderBottom: `3px solid ${C.ink}`, padding: '18px 26px' }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: C.ink }}>Add skills you&apos;ve unlocked</div>
      <div style={{ fontSize: 17, color: C.ink3, marginTop: 2 }}>These are added as plain text.</div>
    </div>
    <div style={{ padding: '20px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ width: 18, height: 18, borderRadius: 4, border: `3px solid ${C.ink}`, background: C.excel }} />
        <span style={{ fontSize: 21, fontWeight: 800, color: C.ink }}>Excel</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        {skills.map((s, i) => (
          <span key={s} style={{ ...CHIP, visibility: gone[i] ? 'hidden' : 'visible' }}>{s}</span>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `3px solid ${C.ink}`, padding: '16px 26px' }}>
      <span style={{ fontSize: 18, fontWeight: 800, color: C.ink3 }}>{skills.length} selected</span>
      <div style={{ height: 52, padding: '0 22px', display: 'flex', alignItems: 'center', borderRadius: 8, border: `3px solid ${C.ink}`, background: C.accent, color: '#fff', fontSize: 20, fontWeight: 800, transform: `translate(${4 * confirm}px, ${4 * confirm}px)`, boxShadow: shadow(4 - 4 * confirm) }}>
        Add {skills.length} to resume
      </div>
    </div>
  </div>
);
export const CHIP: React.CSSProperties = { borderRadius: 6, border: `3px solid ${C.ink}`, padding: '8px 14px', fontSize: 19, fontWeight: 800, background: C.excel, color: '#fff', fontFamily: F.display, whiteSpace: 'nowrap', boxShadow: shadow(4) };

const R = { paper: '#ffffff', ink: '#111111', muted: '#444444', shade: '#d9d9d9' };
const RHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ margin: '18px 0 8px', padding: '4px 10px', fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: R.ink, background: R.shade, border: `1.5px solid ${R.ink}` }}>{children}</div>
);

/** The resume document (the app's template: black on white, grey section bars). */
export const ResumeSheet: React.FC<{ base: string[]; added: string[]; flash: number[]; docx?: number }> = ({ base, added, flash, docx = -1 }) => (
  <div style={{ position: 'relative', width: 560, height: 760, boxSizing: 'border-box', background: R.paper, color: R.ink, padding: '36px 38px', fontFamily: 'Arial, Helvetica, sans-serif', border: `4px solid ${C.ink}`, boxShadow: shadow(10) }}>
    <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 700, letterSpacing: '0.03em' }}>MEERA IYER</div>
    <div style={{ textAlign: 'center', fontSize: 13, color: R.muted, marginTop: 6 }}>meera.iyer@example.com  |  linkedin.com/in/meera-iyer</div>
    <RHead>Education</RHead>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><b>B.Com (Hons), University of Delhi</b><span>2024</span></div>
    <RHead>Work experience</RHead>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><b>UpForge Consulting · Business Analyst</b><span>2024 –</span></div>
    <ul style={{ margin: '6px 0 0', paddingLeft: 20, fontSize: 14, lineHeight: 1.5 }}>
      <li>Built weekly KPI dashboards for 3 client engagements</li>
      <li>Cut month-end reporting time by 30% with templated models</li>
    </ul>
    <RHead>Skills</RHead>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 16, lineHeight: 1.35 }}>
      <div>{base.join(' · ')}</div>
      {added.map((s, i) => (
        <div key={s} style={{ alignSelf: 'flex-start', background: `rgba(255, 216, 61, ${flash[i] ?? 0})`, fontWeight: 700, padding: '0 4px', marginLeft: -4 }}>{s}</div>
      ))}
    </div>
    {docx >= 0 && (
      <div style={{ position: 'absolute', right: -44, top: -30, transform: `rotate(6deg) scale(${1 + 0.7 * (1 - prog(docx, 0, 6, E.fall))})`, opacity: prog(docx, 0, 3, E.linear), display: 'flex', alignItems: 'center', gap: 10, height: 64, padding: '0 20px', borderRadius: 10, border: `4px solid ${C.ink}`, background: C.accent, color: '#fff', fontFamily: F.display, fontWeight: 800, fontSize: 26, boxShadow: shadow(6) }}>
        <Download size={26} strokeWidth={3} /> Export .docx
      </div>
    )}
  </div>
);

// ---- level gauge -------------------------------------------------------------------------------------------
export const GAUGE_LEVELS = ['Curious Mind', 'Active Learner', 'Builder Mindset', 'Flow State', 'Maker'];
/** Semicircle, five equal bands (Level 1..5). `pos` is the needle position in bands (0..5). */
export const Gauge: React.FC<{ r: number; pos: number; lit: number }> = ({ r, pos, lit }) => {
  const band = Math.PI / 5;
  const arc = (i: number, r0: number, r1: number) => {
    const a0 = Math.PI + i * band + 0.025;
    const a1 = Math.PI + (i + 1) * band - 0.025;
    const p = (a: number, rr: number) => `${r + rr * Math.cos(a)} ${r + rr * Math.sin(a)}`;
    return `M ${p(a0, r1)} A ${r1} ${r1} 0 0 1 ${p(a1, r1)} L ${p(a1, r0)} A ${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`;
  };
  const cols = [C.paper3, C.next, C.successSoft, C.accent, C.ink3];
  const na = Math.PI + Math.max(0, Math.min(5, pos)) * band;
  return (
    <svg width={2 * r} height={r + 30} viewBox={`0 0 ${2 * r} ${r + 30}`} style={{ overflow: 'visible' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={arc(i, r * 0.62, r)} fill={i < lit ? cols[i] : '#2a2a2a'} stroke={C.paper} strokeWidth={5} />
      ))}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = Math.PI + (i + 0.5) * band;
        const rr = r * 0.81;
        return (
          <text key={i} x={r + rr * Math.cos(a)} y={r + rr * Math.sin(a) + 12} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={34} fill={i < lit ? (i === 3 ? '#fff' : C.ink) : '#777'}>
            L{i + 1}
          </text>
        );
      })}
      <line x1={r} y1={r} x2={r + r * 0.9 * Math.cos(na)} y2={r + r * 0.9 * Math.sin(na)} stroke={C.login} strokeWidth={14} strokeLinecap="round" />
      <circle cx={r} cy={r} r={30} fill={C.login} stroke={C.paper} strokeWidth={6} />
    </svg>
  );
};

// ---- summit flag --------------------------------------------------------------------------------------------
export const Flag: React.FC<{ up: number; wave: number }> = ({ up, wave }) => (
  <div style={{ position: 'relative', width: 260, height: 520 }}>
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: 16, height: 520, background: C.paper, border: `3px solid ${C.ink}`, borderRadius: 4 }} />
    <div style={{ position: 'absolute', left: 16, top: 12 + (1 - up) * 330, width: 220, height: 150, background: C.accent, border: `5px solid ${C.paper}`, borderLeft: 'none', clipPath: `polygon(0 0, 100% ${8 + Math.sin(wave / 9) * 5}%, 86% 50%, 100% ${92 + Math.sin(wave / 9 + 1) * 5}%, 0 100%)`, display: 'flex', alignItems: 'center', paddingLeft: 30, boxSizing: 'border-box', fontFamily: F.display, fontWeight: 800, fontSize: 60, color: '#fff' }}>UF</div>
  </div>
);

// ---- DM window (generic chat UI, no platform branding) ------------------------------------------------------
export const DM: React.FC<{ typed: string; caret: boolean; sent: number; sendPress: number; seen: number }> = ({ typed, caret, sent, sendPress, seen }) => {
  const k = sent < 0 ? 0 : prog(sent, 0, 14, E.ui);
  return (
    <div style={{ width: 700, height: 760, borderRadius: 26, border: `5px solid ${C.ink}`, background: C.paper2, boxShadow: shadow(16), fontFamily: F.display, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: 110, display: 'flex', alignItems: 'center', gap: 18, padding: '0 28px', borderBottom: `4px solid ${C.ink}`, background: C.paper }}>
        <Tile size={66} />
        <div>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>UpForge Learning</div>
          <div style={{ fontSize: 19, fontWeight: 600, color: C.ink3 }}>Direct message</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 28, top: 150, maxWidth: 480, padding: '16px 22px', borderRadius: '22px 22px 22px 6px', border: `3px solid ${C.ink}`, background: C.paper3, fontSize: 25, fontWeight: 600, color: C.ink, lineHeight: 1.3 }}>
        The beta is invite only. Want a spot?
      </div>
      {sent >= 0 && (
        <div style={{ position: 'absolute', right: 28, top: 300 + (1 - k) * 330, transform: `scale(${0.7 + 0.3 * k})`, transformOrigin: '100% 100%', padding: '16px 28px', borderRadius: '22px 22px 6px 22px', border: `3px solid ${C.ink}`, background: C.accent, color: '#fff', fontSize: 34, fontWeight: 800, letterSpacing: '0.06em', boxShadow: shadow(5) }}>
          BETA
        </div>
      )}
      {seen >= 0 && (
        <div style={{ position: 'absolute', right: 30, top: 388, fontFamily: F.mono, fontSize: 18, fontWeight: 700, color: C.ink3, opacity: prog(seen, 0, 8, E.ui) }}>Sent ✓</div>
      )}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 26, height: 84, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1, height: 76, borderRadius: 99, border: `4px solid ${C.ink}`, background: C.paper, display: 'flex', alignItems: 'center', padding: '0 28px', fontSize: 32, fontWeight: 800, letterSpacing: '0.06em', color: typed ? C.ink : C.ink3 }}>
          {typed || <span style={{ fontWeight: 600, letterSpacing: 0, fontSize: 26 }}>Message…</span>}
          {caret && <span style={{ display: 'inline-block', width: 4, height: 38, background: C.accent, marginLeft: 4 }} />}
        </div>
        <div style={{ width: 76, height: 76, borderRadius: 99, border: `4px solid ${C.ink}`, background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translate(${4 * sendPress}px, ${4 * sendPress}px)`, boxShadow: shadow(5 - 5 * sendPress) }}>
          <Send size={32} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export { ArticleMark };
