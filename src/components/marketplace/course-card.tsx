import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { TierBadge } from "./tier-badge";
import { EnrollButton } from "./enroll-button";
import { ICONS, FALLBACK_ICON, ClockMark, SignalMark, StreakMark, SparkMark } from "@/components/icons";
import { trackColor, trackInk } from "@/lib/track-colors";
import type { MarketplaceCourse } from "@/lib/queries";

export function CourseCard({
  course,
  index = 0,
  trending = false,
}: {
  course: MarketplaceCourse;
  index?: number;
  trending?: boolean;
}) {
  const Icon = ICONS[course.iconKey ?? course.id] ?? FALLBACK_ICON;

  const ink = trackInk(course.id);

  return (
    <Reveal index={index}>
      <Card className="press flex h-full flex-col gap-4" style={{ backgroundColor: trackColor(course.id) }}>
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-paper-2"
            style={{ color: trackColor(course.id) }}
          >
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/marketplace/course/${course.id}`} className="font-display text-lg font-bold hover:underline" style={{ color: ink }}>
                {course.label}
              </Link>
              {trending && (
                <span className="flex items-center gap-0.5 rounded-sm border-2 border-ink bg-paper-2 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                  <StreakMark size={11} /> Trending
                </span>
              )}
            </div>
            <TierBadge tier={course.tier} />
            {course.newResourceCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-0.5 align-middle text-[11px] font-medium" style={{ color: ink }}>
                <SparkMark size={11} /> {course.newResourceCount} new
              </span>
            )}
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: ink }}>{course.summary}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: ink }}>
          {course.estimatedHours != null && (
            <span className="flex items-center gap-1">
              <ClockMark size={13} /> {course.estimatedHours}h total
            </span>
          )}
          {course.effortPerWeek && (
            <span className="flex items-center gap-1">
              <SignalMark size={13} /> {course.effortPerWeek}/week
            </span>
          )}
          <span>{course.topicCount} topics</span>
        </div>

        {course.skillNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.skillNames.slice(0, 4).map((name) => (
              <Badge key={name}>{name}</Badge>
            ))}
            {course.skillNames.length > 4 && <Badge>+{course.skillNames.length - 4} more</Badge>}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <Link href={`/marketplace/course/${course.id}`} className="text-sm font-bold underline decoration-2 underline-offset-4" style={{ color: ink }}>
            View syllabus
          </Link>
          <EnrollButton kind="track" id={course.id} label={course.label} enrolled={course.enrolled} continueHref={`/track/${course.id}`} />
        </div>
      </Card>
    </Reveal>
  );
}
