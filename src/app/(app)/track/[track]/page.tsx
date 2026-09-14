import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTrackDetail } from "@/lib/queries";
import { TopicRow } from "@/components/track/topic-row";
import { LeaveCourseButton } from "@/components/track/leave-course-button";

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold uppercase tracking-wider text-accent">{track.label} Track</div>
          <LeaveCourseButton trackId={track.id} trackLabel={track.label} />
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          Your roadmap
        </h1>
        <p className="mt-2 text-ink-2">
          {doneTopics} of {totalTopics} topics complete across {phases.length} phases.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {phases.map((phase, pi) => (
          <section key={phase.id}>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-display text-sm font-bold text-accent">Phase {pi + 1}</span>
              <h2 className="font-display text-xl font-bold text-ink">{phase.title}</h2>
              {phase.estimated_weeks && (
                <span className="ml-auto text-xs text-ink-3">{phase.estimated_weeks} weeks</span>
              )}
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
        ))}
      </div>
    </div>
  );
}
