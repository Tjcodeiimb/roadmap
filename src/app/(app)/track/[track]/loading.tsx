import { Skeleton } from "@/components/ui/skeleton";

export default function TrackLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="flex flex-col gap-10">
        {Array.from({ length: 2 }).map((_, pi) => (
          <section key={pi}>
            <Skeleton className="mb-4 h-5 w-48" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, ti) => (
                <Skeleton key={ti} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
