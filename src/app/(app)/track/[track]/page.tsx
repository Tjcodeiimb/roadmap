import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrackDetail } from "@/lib/queries";
import { TopicRow } from "@/components/track/topic-row";
import { LeaveCourseButton } from "@/components/track/leave-course-button";
import { CourseProgressBanner } from "@/components/track/course-progress-banner";
import { trackColor } from "@/lib/track-colors";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackId } = await params;
  const supabase = await createClient();
  const { track, phases } = await getTrackDetail(supabase, trackId);
  if (!track) notFound();

  const totalTopics = phases.reduce((n, p) => n + p.topics.length, 0);
  const doneTopics = phases.reduce((n, p) => n + p.topics.filter((t) => t.status === "done").length, 0);
  const activeTopics = phases.reduce((n, p) => n + p.topics.filter((t) => t.status === "active").length, 0);
  const pct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const phaseProgress = phases.map((p) => ({
    title: p.title,
    done: p.topics.filter((t) => t.status === "done").length,
    total: p.topics.length,
  }));

  const color = trackColor(track.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold uppercase tracking-wider" style={{ color }}>
            {track.label} Track
          </div>
          <LeaveCourseButton trackId={track.id} trackLabel={track.label} />
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Your roadmap
        </h1>

        <CourseProgressBanner
          color={color}
          pct={pct}
          doneTopics={doneTopics}
          activeTopics={activeTopics}
          totalTopics={totalTopics}
          phases={phaseProgress}
        />
      </div>

      {/* Phases + topics */}
      <div className="flex flex-col gap-10">
        {phases.map((phase, pi) => {
          const phaseDone = phase.topics.filter((t) => t.status === "done").length;
          const phaseTotal = phase.topics.length;
          const phasePct = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;

          return (
            <section key={phase.id}>
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-display text-sm font-bold" style={{ color }}>Phase {pi + 1}</span>
                <h2 className="font-display text-xl font-bold text-ink">{phase.title}</h2>
                {phase.estimated_weeks && (
                  <span className="ml-auto text-xs text-ink-3">{phase.estimated_weeks} weeks</span>
                )}
              </div>

              {/* Phase progress bar */}
              <div className="mb-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-paper-2 border border-ink/20">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${phasePct}%`,
                      backgroundColor: phaseDone === phaseTotal && phaseTotal > 0 ? "var(--success)" : color,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-ink-3">{phaseDone}/{phaseTotal}</span>
              </div>

              <p className="mb-4 text-sm text-ink-2">{phase.description}</p>
              <div className="flex flex-col gap-2">
                {phase.topics.map((topic, ti) => (
                  <TopicRow
                    key={topic.id}
                    href={`/track/${track.id}/topic/${topic.id}`}
                    title={topic.title}
                    status={topic.status}
                    estimatedTime={topic.estimated_time}
                    index={ti}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
