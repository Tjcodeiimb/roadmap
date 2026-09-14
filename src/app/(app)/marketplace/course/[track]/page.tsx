import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCourseDetail } from "@/lib/queries";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { EnrollButton } from "@/components/marketplace/enroll-button";
import { Badge } from "@/components/ui/badge";
import { ICONS, FALLBACK_ICON, ClockMark, SignalMark } from "@/components/icons";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackId } = await params;
  const supabase = await createClient();
  const detail = await getCourseDetail(supabase, trackId);
  if (!detail) notFound();

  const { track, phases, topicCount, resourceCount, skillNames, enrolled } = detail;
  const Icon = ICONS[track.icon_key ?? track.id] ?? FALLBACK_ICON;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Link href="/marketplace" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Back to marketplace
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon size={28} />
          </div>
          <div>
            <TierBadge tier={track.tier} />
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{track.label}</h1>
          </div>
        </div>
        <p className="text-base leading-relaxed text-ink-2">{track.summary}</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
          {track.estimated_hours != null && (
            <span className="flex items-center gap-1.5">
              <ClockMark size={14} /> {track.estimated_hours} hours total
            </span>
          )}
          {track.effort_per_week && (
            <span className="flex items-center gap-1.5">
              <SignalMark size={14} /> {track.effort_per_week} per week
            </span>
          )}
          <span>
            {topicCount} topics · {resourceCount} resources
          </span>
        </div>

        <EnrollButton kind="track" id={track.id} label={track.label} enrolled={enrolled} continueHref={`/track/${track.id}`} />
      </div>

      {skillNames.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold text-ink">Skills you&apos;ll earn</div>
          <div className="flex flex-wrap gap-1.5">
            {skillNames.map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 text-sm font-semibold text-ink">Syllabus</div>
        <div className="flex flex-col gap-3">
          {phases.map((phase, i) => (
            <div key={phase.id} className="rounded-xl border border-border bg-paper-2 p-4">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xs font-bold text-accent">Phase {i + 1}</span>
                <span className="font-semibold text-ink">{phase.title}</span>
                {phase.estimated_weeks && (
                  <span className="ml-auto text-xs text-ink-3">{phase.estimated_weeks} weeks</span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-2">{phase.description}</p>
              <div className="mt-2 text-xs text-ink-3">{phase.topics.length} topics</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
