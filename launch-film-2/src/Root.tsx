import { Composition, useCurrentFrame } from 'remotion';
import { Film, Launch } from './Launch';
import { LaunchSub, subMetadata } from './LaunchSub';
import { FontGate } from './lib/FontGate';
import { ACT, ACT_ORDER, ActId, FPS, H, TOTAL, W } from './timeline';


/** One act on its own, for preview and contact sheets (includes the tear into the next act). */
const ActPreview: React.FC<{ id: ActId }> = ({ id }) => {
  const f = useCurrentFrame();
  return (
    <FontGate>
      <Film frame={ACT[id].from + f} />
    </FontGate>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Launch" component={Launch} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ muted: true }} />
    {/* The film as sub-frames for the motion-blurred master (render.mjs --blur). */}
    <Composition id="LaunchSub" component={LaunchSub} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ groups: [] as number[] }} calculateMetadata={subMetadata} />
    {ACT_ORDER.map((id) => (
      <Composition key={id} id={`Act-${id}`} component={ActPreview} durationInFrames={ACT[id].dur} fps={FPS} width={W} height={H} defaultProps={{ id }} />
    ))}
  </>
);
