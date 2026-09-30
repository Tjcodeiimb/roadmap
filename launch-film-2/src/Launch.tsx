import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { FontGate } from './lib/FontGate';
import { ACT, ACT_ORDER, TOTAL } from './timeline';
import { ACTS } from './acts';
import { C } from './theme';

export const actAt = (F: number) => {
  const i = Math.max(0, ACT_ORDER.findIndex((id) => F >= ACT[id].from && F < ACT[id].from + ACT[id].dur));
  const id = F >= TOTAL ? ACT_ORDER[ACT_ORDER.length - 1] : ACT_ORDER[i];
  return { id, f: F - ACT[id].from };
};

/** Every act connects by a hard cut on its downbeat, so the film is just "which act, which local frame". */
export const Film: React.FC<{ frame: number }> = ({ frame }) => {
  const { id, f } = actAt(frame);
  const Act = ACTS[id];
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <Act f={f} />
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
