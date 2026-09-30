// The film's own frame around the rebuilt UI: the desk-calendar week strip, pages that tear off it,
// stamped copy labels and the tap cursor. Pure components; timing is passed in.
import { CheckMark } from './icons/glyphs';
import { E, hitPulse, prog } from './lib/anim';
import { measureTracked } from './lib/measure';
import { C, F, shadow, UI_ZOOM } from './theme';
import { H, W } from './timeline';
import { DAYS } from './data';

export const MARGIN = 60;
export const STRIP = { x: 40, y: 44, w: 1000, bindH: 18, tabY: 76, tabH: 118, gap: 10 };
export const TAB_W = (STRIP.w - STRIP.gap * 6) / 7;
export const PAGE_Y = STRIP.tabY + STRIP.tabH + 26; // pages hang below the strip

// ---- week strip ----------------------------------------------------------------------------------
export type DayState = 'future' | 'today' | 'past' | 'rest';

const TAB_LOOK: Record<DayState, { bg: string; fg: string }> = {
  future: { bg: C.paper2, fg: C.ink3 },
  today: { bg: C.ink, fg: C.paper },
  past: { bg: C.done, fg: '#ffffff' },
  rest: { bg: C.login, fg: C.ink },
};

export const WeekStrip: React.FC<{ states: DayState[]; appear: number[]; pops: number[]; dy?: number }> = ({ states, appear, pops, dy = 0 }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: 0, transform: `translate(0px, ${dy}px)` }}>
    <div style={{ position: 'absolute', left: STRIP.x, top: STRIP.y, width: STRIP.w, height: STRIP.bindH, background: C.ink, borderRadius: 4 }} />
    {DAYS.map((d, i) => {
      const look = TAB_LOOK[states[i]];
      const a = appear[i];
      if (a <= 0) return null;
      const p = pops[i];
      return (
        <div
          key={d}
          style={{
            position: 'absolute', left: STRIP.x + i * (TAB_W + STRIP.gap), top: STRIP.tabY, width: TAB_W, height: STRIP.tabH,
            borderRadius: 10, border: `5px solid ${C.ink}`, background: look.bg, color: look.fg, boxShadow: shadow(6),
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            transform: `translate(0px, ${(1 - a) * -46}px) scale(${(0.7 + 0.3 * a) * (1 + 0.12 * p)})`,
            fontFamily: F.mono, fontWeight: 700,
          }}
        >
          <span style={{ fontSize: 34, letterSpacing: '0.02em' }}>{d}</span>
          <span style={{ height: 30, display: 'flex', alignItems: 'center' }}>
            {states[i] === 'past' && <CheckMark size={30} strokeWidth={3} />}
            {states[i] === 'today' && <span style={{ width: 14, height: 14, borderRadius: 99, background: C.login }} />}
          </span>
        </div>
      );
    })}
  </div>
);

// ---- copy labels ---------------------------------------------------------------------------------
// Every headline in the film, so they can all share one size, fitted to the widest line.
export const COPY: Record<string, string[]> = {
  open: ['One week.'],
  mon: ['Pick one.'],
  tue: ['Watch.'],
  wed: ['It tracks', 'itself.'],
  thu: ['Keep the', 'streak.'],
  fri: ['Unlock it.'],
  sat: ['Straight onto', 'your resume.'],
  end: ['Finish what', 'you start.'],
};
const COPY_MAX_W = W - MARGIN * 2 - 2 * 34 - 10; // inside the label's padding
const COPY_TRACK = -0.025;

export const copySize = () => {
  let widest = 0;
  for (const lines of Object.values(COPY)) for (const l of lines) widest = Math.max(widest, measureTracked(l, 100, 900, COPY_TRACK, F.display));
  return Math.min(128, Math.floor((COPY_MAX_W / widest) * 100));
};

/** Lift (px above rest) and squash (px into the shadow) for something stamped onto the page at t = 0. */
export const stamp = (t: number, lift = 26) => {
  if (t < -4) return { on: false, lift: 0, squash: 0 };
  const l = t < 0 ? lift * (1 - E.stamp(prog(t, -4, 0, E.linear))) : 0;
  return { on: true, lift: l, squash: 5 * hitPulse(t, 1, 3) };
};

export const StampLabel: React.FC<{
  lines: string[];
  size: number;
  t: number;
  x?: number;
  y: number;
  bg?: string;
  fg?: string;
}> = ({ lines, size, t, x = MARGIN, y, bg = C.paper2, fg = C.ink }) => {
  const s = stamp(t);
  if (!s.on) return null;
  const rest = 12;
  const d = -s.lift + s.squash;
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, padding: '18px 34px 22px', borderRadius: 10, border: `6px solid ${C.ink}`,
        background: bg, color: fg, fontFamily: F.display, fontWeight: 900, fontSize: size, lineHeight: 1.0,
        letterSpacing: `${COPY_TRACK}em`, whiteSpace: 'nowrap',
        transform: `translate(${d}px, ${d}px)`, boxShadow: shadow(rest + s.lift - s.squash),
      }}
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
};

/** A small mono tag, stamped the same way (used for the chip under a headline). */
export const StampTag: React.FC<{ text: string; t: number; x: number; y: number; bg?: string; fg?: string }> = ({ text, t, x, y, bg = C.login, fg = C.ink }) => {
  const s = stamp(t, 16);
  if (!s.on) return null;
  const d = -s.lift + s.squash * 0.6;
  return (
    <div style={{ position: 'absolute', left: x, top: y, padding: '12px 22px', borderRadius: 8, border: `5px solid ${C.ink}`, background: bg, color: fg, fontFamily: F.mono, fontWeight: 700, fontSize: 40, whiteSpace: 'nowrap', transform: `translate(${d}px, ${d}px)`, boxShadow: shadow(8 + s.lift - s.squash * 0.6) }}>
      {text}
    </div>
  );
};

// ---- tap cursor ------------------------------------------------------------------------------------
export const TapCursor: React.FC<{ x: number; y: number; press: number; show: number }> = ({ x, y, press, show }) => {
  if (show <= 0) return null;
  const r = 44;
  const d = 6 * press;
  return (
    <div
      style={{
        position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: 99, border: `6px solid ${C.ink}`,
        background: 'rgba(255,255,255,0.55)', boxShadow: shadow(6 - d), transform: `translate(${d}px, ${d}px) scale(${show})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: 22 + 22 * press, height: 22 + 22 * press, borderRadius: 99, background: C.ink }} />
    </div>
  );
};

// ---- pages ---------------------------------------------------------------------------------------
// Perforated top edge: the line the page tears along.
const PERF = (() => {
  const teeth = 36;
  const pts: string[] = ['0% 100%'];
  for (let i = 0; i <= teeth; i++) pts.push(`${(i / teeth) * 100}% ${i % 2 ? 14 : 0}px`);
  pts.push('100% 100%');
  return `polygon(${pts.join(', ')})`;
})();

/** One page of the pad. `tear` 0..1 rips it up and away; the page underneath is already at rest. */
export const Page: React.FC<{ tear?: number; children?: React.ReactNode; bg?: string }> = ({ tear = 0, children, bg = C.paper }) => {
  const up = tear * (H + 260);
  const rot = -8 * tear;
  const lift = 34 * Math.min(1, tear * 3);
  return (
    <div style={{ position: 'absolute', left: 0, top: PAGE_Y, width: W, height: H - PAGE_Y + 40, transform: `translate(${-lift * 0.3}px, ${-up}px) rotate(${rot}deg)`, transformOrigin: '0% 0%' }}>
      {tear > 0 && <div style={{ position: 'absolute', inset: 0, background: C.ink, transform: `translate(${lift}px, ${lift}px)`, clipPath: PERF }} />}
      <div style={{ position: 'absolute', inset: 0, background: bg, clipPath: PERF, overflow: 'hidden' }}>
        {/* children use frame coordinates: shift back up by the page offset */}
        <div style={{ position: 'absolute', left: 0, top: -PAGE_Y, width: W, height: H }}>{children}</div>
      </div>
    </div>
  );
};

/** App UI shown at UI_ZOOM with its top-left at (x, y) in frame px, with a slow push so a hold is never dead. */
export const Screen: React.FC<{ x?: number; y: number; push?: number; origin?: string; children: React.ReactNode }> = ({ x = MARGIN, y, push = 0, origin = '50% 0%', children }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: W - 2 * x, transform: `scale(${1 + push})`, transformOrigin: origin }}>
    <div style={{ zoom: UI_ZOOM, width: (W - 2 * x) / UI_ZOOM, position: 'relative' }}>{children}</div>
  </div>
);

/** Frame-px position of a point given in app px inside a Screen at (x, y). */
export const ui = (x0: number, y0: number, ax: number, ay: number) => ({ x: x0 + ax * UI_ZOOM, y: y0 + ay * UI_ZOOM });
