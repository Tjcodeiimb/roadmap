import { Skeleton } from "@/components/ui/skeleton";

export default function MyCoursesLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-md border-2 border-ink bg-paper-2 p-4 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="mt-2 h-3.5 w-full max-w-sm" />
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-5 w-20 rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-36" />
        <div className="flex flex-col gap-1.5 rounded-md border-2 border-ink bg-paper-2 p-3 shadow-[3px_3px_0_0_var(--brutal-shadow)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
