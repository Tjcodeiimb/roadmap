import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ClockMark, VideoMark, CheckCircleMark } from "@/components/icons";

function formatHours(seconds: number) {
  const hours = seconds / 3600;
  return hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
}

export function WatchStats({
  secondsWatched,
  resourcesCompleted,
  videosCompleted,
  topicsDone,
}: {
  secondsWatched: number;
  resourcesCompleted: number;
  videosCompleted: number;
  topicsDone: number;
}) {
  return (
    <Card>
      <div className="mb-4 text-sm font-semibold text-ink">Learning stats</div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <ClockMark size={20} className="text-accent" />
          <div className="font-display text-xl font-bold text-ink">{formatHours(secondsWatched)}</div>
          <div className="text-xs text-ink-3">hours watched</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <VideoMark size={20} className="text-accent" />
          <div className="font-display text-xl font-bold text-ink">
            <CountUp value={videosCompleted} />
          </div>
          <div className="text-xs text-ink-3">videos finished</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <CheckCircleMark size={20} className="text-accent" />
          <div className="font-display text-xl font-bold text-ink">
            <CountUp value={resourcesCompleted} />
          </div>
          <div className="text-xs text-ink-3">resources done</div>
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <CheckCircleMark size={20} className="text-accent" />
          <div className="font-display text-xl font-bold text-ink">
            <CountUp value={topicsDone} />
          </div>
          <div className="text-xs text-ink-3">topics done</div>
        </div>
      </div>
    </Card>
  );
}
