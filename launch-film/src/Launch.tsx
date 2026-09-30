import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { FontGate } from './lib/FontGate';
import { E, hitPulse, prog, tw } from './lib/anim';
import { ACT, ACT_ORDER, TEAR, TOTAL } from './timeline';
import { ACTS, EndCard, OPEN, SUN, SUN_STRIP_DY } from './acts';
import { DayState, Page, WeekStrip } from './chrome';
import { C, shadow } from './theme';

const DAY_ACTS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const actAt = (F: number) => {
  const i = Math.max(0, ACT_ORDER.findIndex((id) => F >= ACT[id].from && F < ACT[id].from + ACT[id].dur));
  const id = F >= TOTAL ? 'sun' : ACT_ORDER[i];
  return { id, f: F - ACT[id].from };
};

/** The desk-calendar strip, computed once from the absolute frame so every act shows the same thing. */
const strip = (F: number) => {
  const idx = DAY_ACTS.reduce((m, d, i) => (F >= ACT[d].from ? i : m), -1);
  const states: DayState[] = DAY_ACTS.map((_, i) => (idx === 6 && i === 6 ? 'rest' : i < idx ? 'past' : i === idx ? 'today' : 'future'));
  const appear = OPEN.tabs.map((t) => prog(F, t - 6, t, E.stamp));
  const pops = DAY_ACTS.map((_, i) => {
    let p = hitPulse(F - OPEN.tabs[i]);
    if (idx >= 0) {
      const change = ACT[DAY_ACTS[idx]].from;
      if (i === idx || i === idx - 1) p = Math.max(p, hitPulse(F - change));
    }
    return p;
  });
  const fs = F - ACT.sun.from;
  const dy = fs >= 0 ? tw(fs, SUN.strip[0], SUN.strip[1], 0, SUN_STRIP_DY, E.scroll) : 0;
  return { states, appear, pops, dy };
};

/** Something ripped off the whole pad (the outro), same motion as a page tear. */
const Torn: React.FC<{ p: number; children: React.ReactNode }> = ({ p, children }) => {
  const lift = 34 * Math.min(1, p * 3);
  return (
    <div style={{ position: 'absolute', inset: 0, transform: `translate(${-lift * 0.3}px, ${-p * 2200}px) rotate(${-8 * p}deg)`, transformOrigin: '0% 0%' }}>
      {p > 0 && <div style={{ position: 'absolute', inset: 0, background: C.ink, transform: `translate(${lift}px, ${lift}px)` }} />}
      <div style={{ position: 'absolute', inset: 0, background: C.paper, overflow: 'hidden', boxShadow: p > 0 ? shadow(0) : undefined }}>{children}</div>
    </div>
  );
};

export const Film: React.FC<{ frame: number }> = ({ frame }) => {
  const { id, f } = actAt(frame);
  const i = ACT_ORDER.indexOf(id);
  const Act = ACTS[id];
  const dur = ACT[id].dur;
  const tearing = id !== 'sun' && f >= dur - TEAR;
  const Next = tearing ? ACTS[ACT_ORDER[i + 1]] : null;
  const tearP = tearing ? prog(f, dur - TEAR, dur, E.tear) : 0;
  const isSun = id === 'sun';
  const outroP = isSun ? prog(f, SUN.outro - TEAR, SUN.outro, E.tear) : 0;
  const padGone = isSun && Math.round(f) >= SUN.outro;
  const s = strip(frame);
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      {isSun && f >= SUN.outro - TEAR && <EndCard f={f} />}
      {!padGone && (
        <Torn p={outroP}>
          {Next && (
            <Page>
              <Next f={0} />
            </Page>
          )}
          <Page tear={tearP}>
            <Act f={f} />
          </Page>
          <WeekStrip states={s.states} appear={s.appear} pops={s.pops} dy={s.dy} />
        </Torn>
      )}
    </AbsoluteFill>
  );
};

export const Launch: React.FC<{ muted?: boolean }> = ({ muted }) => {
  const frame = useCurrentFrame();
  return (
    <FontGate>
      <Film frame={frame} />
      {!muted && <Audio src={staticFile('audio/soundtrack.wav')} />}
    </FontGate>
  );
};
