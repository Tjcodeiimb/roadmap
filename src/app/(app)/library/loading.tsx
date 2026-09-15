import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="mt-4 flex gap-6">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-md border-2 border-ink bg-paper-2 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
