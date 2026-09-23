import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopicDetail } from "@/lib/queries";
import { creditCrossCourseProgress } from "@/app/actions/progress";
import { ResourceCard } from "@/components/track/resource-card";
import { TopicProgressHeader } from "@/components/track/topic-progress-header";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ track: string; topicId: string }>;
}) {
  const { track, topicId } = await params;
  const supabase = await createClient();
  // Migrations 0024 and 0026 — credits any resource in this topic that
  // duplicates one the learner already finished elsewhere, or belongs to a
  // topic asserted equivalent to one finished elsewhere, before reading
  // progress.
  await creditCrossCourseProgress(track);
  const detail = await getTopicDetail(supabase, topicId);
  if (!detail) notFound();

  const { topic, resources, status } = detail;

  const resourcesDone = resources.filter((r) => r.status === "done").length;
  // Seed data for some tracks carries step entries with no text at all, which
  // rendered as a list of bare numbers. Only keep steps that say something.
  const steps = (topic.steps ?? []).filter(
    (s) => (s?.t ?? "").trim() || (s?.d ?? "").trim()
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Link
        href={`/track/${track}`}
        className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to roadmap
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {topic.section && <Badge>{topic.section}</Badge>}
          {topic.estimated_time && <Badge>{topic.estimated_time}</Badge>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">{topic.title}</h1>
        {topic.description && <p className="mt-3 text-base leading-relaxed text-ink-2">{topic.description}</p>}
      </div>

      <TopicProgressHeader status={status} done={resourcesDone} total={resources.length} />

      {steps.length > 0 && (
        <div className="rounded-md border-2 border-ink bg-paper-2 p-5 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <div className="mb-3 text-sm font-bold text-ink">What to do</div>
          <ul className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-paper-3 text-[11px] font-bold text-ink-2">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium text-ink">{step.t}</div>
                  <div className="text-ink-2">{step.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-1 text-sm font-semibold text-ink">Resources</div>
        <p className="mb-3 text-xs text-ink-3">
          Opening a resource marks it done. Finish them all and this topic completes itself.
        </p>
        {resources.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-ink/30 p-6 text-center text-sm text-ink-3">
            No resources added yet — check back soon.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {resources.map((r, i) => (
              <Reveal key={r.id} index={i}>
              <ResourceCard
                id={r.id}
                track={track}
                iconKey={r.icon_key}
                title={r.title}
                url={r.url}
                source={r.source}
                format={r.format}
                length={r.length}
                note={r.note}
                status={r.status}
                creditedFrom={r.creditedFrom}
              />
              </Reveal>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
