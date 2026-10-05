import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-2 h-4 w-3/4 max-w-xl" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-md border-2 border-ink bg-paper-2 p-6 shadow-[4px_4px_0_0_var(--brutal-shadow)]"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-11 w-11 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 rounded-sm" />
                  <Skeleton className="mt-2 h-5 w-40" />
                </div>
              </div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
              <Skeleton className="mt-2 h-4 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
