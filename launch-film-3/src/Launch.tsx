import { Audio, staticFile, useCurrentFrame } from 'remotion';
import { FontGate } from './lib/FontGate';
import { ACT } from './timeline';
import { Cta, World } from './acts';

/** One camera through the staircase, then the single hard cut into the CTA. */
export const Film: React.FC<{ frame: number }> = ({ frame }) => (frame < ACT.cta.from ? <World F={frame} /> : <Cta F={frame} />);

export const Launch: React.FC<{ muted?: boolean }> = ({ muted }) => {
  const frame = useCurrentFrame();
  return (
    <FontGate>
      <Film frame={frame} />
      {!muted && <Audio src={staticFile('audio/soundtrack.wav')} />}
    </FontGate>
  );
};
