import { Skeleton } from "@/components/ui/skeleton";

export default function SkillsLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-28" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="flex flex-col gap-8">
        {Array.from({ length: 2 }).map((_, s) => (
          <section key={s}>
            <Skeleton className="mb-3 h-5 w-32" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md border-2 border-ink bg-paper-2 p-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-full" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
