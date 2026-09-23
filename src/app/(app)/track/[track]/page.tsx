import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrackDetail } from "@/lib/queries";
import { creditCrossCourseProgress } from "@/app/actions/progress";
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
  // Credits any resource here that duplicates one the learner already
  // finished elsewhere, or belongs to a topic asserted equivalent to one
  // finished elsewhere (migrations 0024 and 0026), before reading the
  // progress that decides these progress bars — so a credit granted just
  // now is already reflected on this render, not one page load later.
  await creditCrossCourseProgress(trackId);
  const { track, phases } = await getTrackDetail(supabase, trackId);
  if (!track) notFound();

  const totalTopics = phases.reduce((n, p) => n + p.topics.length, 0);
  const doneTopics = phases.reduce((n, p) => n + p.topics.filter((t) => t.status === "done").length, 0);
  const activeTopics = phases.reduce((n, p) => n + p.topics.filter((t) => t.status === "active").length, 0);

  // Progress is measured in resources, not topics, so the bar moves on every
  // resource a learner finishes instead of jumping only when a whole topic
  // completes. Topics carrying no resources fall back to their own status so
  // they still count toward the total.
  const resourceTotal = phases.reduce(
    (n, p) => n + p.topics.reduce((m, t) => m + (t.resourceTotal || 1), 0),
    0
  );
  const resourceDone = phases.reduce(
    (n, p) =>
      n +
      p.topics.reduce(
        (m, t) => m + (t.resourceTotal ? t.resourceDone : t.status === "done" ? 1 : 0),
        0
      ),
    0
  );
  const pct = resourceTotal > 0 ? Math.round((resourceDone / resourceTotal) * 100) : 0;

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
        />
      </div>

      {/* Phases + topics */}
      <div className="flex flex-col gap-10">
        {phases.map((phase, pi) => {
          const phaseDone = phase.topics.reduce(
            (m, t) => m + (t.resourceTotal ? t.resourceDone : t.status === "done" ? 1 : 0),
            0
          );
          const phaseTotal = phase.topics.reduce((m, t) => m + (t.resourceTotal || 1), 0);
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
                    resourceDone={topic.resourceDone}
                    resourceTotal={topic.resourceTotal}
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
