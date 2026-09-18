import { Skeleton } from "@/components/ui/skeleton";

export default function SkillsLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-28" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s} className="overflow-hidden rounded-md border-2 border-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]">
            <div className="flex items-center gap-3 bg-paper-2 px-4 py-3">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="hidden h-2 w-20 sm:block" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
