import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { FontGate } from './lib/FontGate';

// The film: one <Sequence from={ACT.x.from} durationInFrames={ACT.x.dur}> per act.
export const Launch: React.FC<{ muted?: boolean }> = ({ muted }) => (
  <FontGate>
    <AbsoluteFill style={{ background: '#fff' }}>
      {/* acts go here */}
      {!muted && <Audio src={staticFile('audio/soundtrack.wav')} />}
    </AbsoluteFill>
  </FontGate>
);
