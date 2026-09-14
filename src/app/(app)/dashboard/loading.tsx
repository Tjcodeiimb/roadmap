import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-3 h-4 w-48" />
      </div>

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
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-3.5 w-24" />
          </Card>
        ))}
      </div>
    </div>
  );
}
