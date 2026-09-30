import { Composition } from 'remotion';
import { Launch } from './Launch';
import { LaunchSub, subMetadata } from './LaunchSub';
import { FPS, H, TOTAL, W } from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Launch" component={Launch} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ muted: true }} />
    {/* The film as sub-frames for the motion-blurred master (render.mjs --blur). */}
    <Composition id="LaunchSub" component={LaunchSub} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ groups: [] as number[] }} calculateMetadata={subMetadata} />
    {/* Add one composition per act, and single-frame "lab" compositions for each rebuilt screen. */}
  </>
);
