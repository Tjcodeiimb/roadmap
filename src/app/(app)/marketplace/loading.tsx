import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
      </div>

      <Skeleton className="h-11 w-48 rounded-md" />

      <div className="flex flex-col gap-10">
        {[0, 1].map((section) => (
          <section key={section}>
            <Skeleton className="mb-4 h-5 w-32" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Card key={i} className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="mt-2 h-3.5 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex gap-4">
                    <Skeleton className="h-3.5 w-16" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
