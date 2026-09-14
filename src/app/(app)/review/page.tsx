import { createClient } from "@/lib/supabase/server";
import { getReviewQueue } from "@/lib/queries";
import { ReviewCard } from "@/components/review/review-card";
import { CheckCircleMark } from "@/components/icons";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { due, upcoming } = await getReviewQueue(supabase);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Review</h1>
        <p className="mt-2 text-ink-2">
          {due.length > 0
            ? `${due.length} review${due.length === 1 ? "" : "s"} today — a couple of minutes, that's it.`
            : "You're all caught up. Nothing due today."}
        </p>
      </div>

      {due.length > 0 && (
        <div className="flex flex-col gap-3">
          {due.map((item) => (
            <ReviewCard key={item.topicId} item={item} />
          ))}
        </div>
      )}

      {due.length === 0 && (
        <div className="rounded-2xl border border-border bg-paper-2 p-8 text-center">
          <CheckCircleMark size={32} className="mx-auto mb-2 text-success" />
          <div className="font-semibold text-ink">All caught up</div>
          <div className="mt-1 text-sm text-ink-2">Complete more topics and they&apos;ll come back here for review.</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="mb-3 text-sm font-semibold text-ink-2">Coming up</div>
          <div className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <div
                key={item.topicId}
                className="flex items-center justify-between rounded-xl border border-border bg-paper-2/60 px-4 py-3 text-sm"
              >
                <span className="text-ink-2">{item.title}</span>
                <span className="text-xs text-ink-3">{formatUpcoming(item.nextReviewDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatUpcoming(dateStr: string) {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (days <= 1) return "Tomorrow";
  if (days <= 7) return `In ${days} days`;
  return `In ${Math.ceil(days / 7)}w`;
}
