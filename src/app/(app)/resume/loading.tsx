import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResumeLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <div className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <Card key={i} className="flex items-center justify-between gap-4 p-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1.5 h-3.5 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded-md" />
              <Skeleton className="h-9 w-16 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
