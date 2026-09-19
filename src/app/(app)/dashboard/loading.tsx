import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      {/* Heading + level badge */}
      <div>
        <Skeleton className="h-9 w-64" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* XP progress bar */}
      <div>
        <div className="mb-1 flex justify-between">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-sm" />
      </div>

      {/* Divider */}
      <div className="h-0.5 w-full bg-ink/10" />

      {/* Marquee placeholder */}
      <div className="flex gap-3 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-32 shrink-0 rounded-full" />
        ))}
      </div>

      {/* Review card */}
      <Skeleton className="h-14 w-full rounded-md" />

      {/* DiscoverRail heading + cards */}
      <div>
        <Skeleton className="mb-3 h-4 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="flex items-center gap-3 p-4">
              <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-20" />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Course grid */}
      <div>
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-[52px] w-[52px] shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="mt-2 h-3.5 w-28" />
                </div>
              </div>
              <Skeleton className="h-2 w-full rounded-sm" />
              <Skeleton className="h-11 w-full rounded-md" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
