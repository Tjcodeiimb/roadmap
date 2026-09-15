import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCohortDetail } from "@/lib/queries";
import { TierBadge } from "@/components/marketplace/tier-badge";
import { EnrollButton } from "@/components/marketplace/enroll-button";
import { ICONS, FALLBACK_ICON, ClockMark } from "@/components/icons";

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ cohort: string }>;
}) {
  const { cohort: cohortId } = await params;
  const supabase = await createClient();
  const detail = await getCohortDetail(supabase, cohortId);
  if (!detail) notFound();

  const { cohort, courses, enrolled } = detail;
  const Icon = ICONS[cohort.icon_key ?? ""] ?? FALLBACK_ICON;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Link href="/marketplace?tab=cohorts" className="flex w-fit items-center gap-1 text-sm text-ink-2 hover:text-ink">
        <ChevronLeft size={16} /> Back to marketplace
      </Link>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent">
            <Icon size={28} />
          </div>
          <div>
            <TierBadge tier={cohort.tier} />
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink">{cohort.label}</h1>
          </div>
        </div>
        <p className="text-base leading-relaxed text-ink-2">{cohort.summary}</p>

        {cohort.estimated_hours != null && (
          <div className="flex items-center gap-1.5 text-sm text-ink-2">
            <ClockMark size={14} /> {cohort.estimated_hours} hours total across {courses.length} courses
          </div>
        )}

        <EnrollButton kind="cohort" id={cohort.id} label={cohort.label} enrolled={enrolled} continueHref="/dashboard" />
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-ink">What&apos;s included</div>
        <div className="flex flex-col gap-2">
          {courses.map((c, i) => {
            const CourseIcon = ICONS[c.iconKey ?? c.id] ?? FALLBACK_ICON;
            return (
              <Link
                key={c.id}
                href={`/marketplace/course/${c.id}`}
                className="press-sm group flex items-center gap-3 rounded-md border-2 border-ink bg-paper-2 px-4 py-3.5 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
              >
                <span className="font-display text-xs font-bold text-ink-3">{i + 1}</span>
                <CourseIcon size={18} className="text-ink-2" />
                <span className="flex-1 font-medium text-ink">{c.label}</span>
                <ArrowRight size={15} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
