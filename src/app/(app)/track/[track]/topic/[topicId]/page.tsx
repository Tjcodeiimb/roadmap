import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTopicDetail } from "@/lib/queries";
import { ResourceCard } from "@/components/track/resource-card";
import { StatusControl } from "@/components/track/status-control";
import { Badge } from "@/components/ui/badge";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ track: string; topicId: string }>;
}) {
  const { track, topicId } = await params;
  const supabase = await createClient();
  const detail = await getTopicDetail(supabase, topicId);
  if (!detail) notFound();

  const { topic, resources, status } = detail;

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

      <StatusControl topicId={topic.id} status={status} path={`/track/${track}/topic/${topicId}`} />

      {topic.steps.length > 0 && (
        <div className="rounded-md border-2 border-ink bg-paper-2 p-5 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
          <div className="mb-3 text-sm font-bold text-ink">What to do</div>
          <ul className="flex flex-col gap-3">
            {topic.steps.map((step, i) => (
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
        <div className="mb-3 text-sm font-semibold text-ink">Resources</div>
        {resources.length === 0 ? (
          <div className="rounded-md border-2 border-dashed border-ink/30 p-6 text-center text-sm text-ink-3">
            No resources added yet — check back soon.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {resources.map((r) => (
              <ResourceCard
                key={r.id}
                id={r.id}
                iconKey={r.icon_key}
                title={r.title}
                url={r.url}
                source={r.source}
                format={r.format}
                length={r.length}
                note={r.note}
                status={r.status}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom status control — repeat mark-done so user doesn't have to scroll back up */}
      {status !== "done" && (
        <StatusControl topicId={topic.id} status={status} path={`/track/${track}/topic/${topicId}`} />
      )}

    </div>
  );
}
