import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { TierBadge } from "./tier-badge";
import { EnrollButton } from "./enroll-button";
import { ICONS, FALLBACK_ICON, ClockMark } from "@/components/icons";
import { trackColor } from "@/lib/track-colors";
import type { MarketplaceCohort } from "@/lib/queries";

export function CohortCard({ cohort, index = 0 }: { cohort: MarketplaceCohort; index?: number }) {
  const Icon = ICONS[cohort.iconKey ?? ""] ?? FALLBACK_ICON;

  return (
    <Reveal index={index}>
      <Card className="press flex h-full flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-accent-soft text-accent">
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`/marketplace/cohort/${cohort.id}`} className="font-display text-lg font-bold text-ink hover:underline">
              {cohort.label}
            </Link>
            <TierBadge tier={cohort.tier} className="ml-2 align-middle" />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-ink-2">{cohort.summary}</p>

        <div className="flex overflow-hidden rounded-sm border-2 border-ink">
          {cohort.courses.map((c) => (
            <span key={c.id} className="h-2 flex-1" style={{ backgroundColor: trackColor(c.id) }} />
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {cohort.courses.map((c) => (
            <Badge key={c.id}>{c.label}</Badge>
          ))}
        </div>

        {cohort.estimatedHours != null && (
          <div className="flex items-center gap-1 text-xs text-ink-3">
            <ClockMark size={13} /> {cohort.estimatedHours}h total · {cohort.courses.length} courses
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <Link href={`/marketplace/cohort/${cohort.id}`} className="text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink">
            View bundle
          </Link>
          <EnrollButton kind="cohort" id={cohort.id} label={cohort.label} enrolled={cohort.enrolled} continueHref="/dashboard" />
        </div>
      </Card>
    </Reveal>
  );
}
