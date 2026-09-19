"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { REVIEW_QUALITY_BUTTONS, REVIEW_QUALITY_LABELS } from "@/lib/gamification/constants";
import { reviewTopic } from "@/app/actions/progress";
import { useToast } from "@/components/ui/toast";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import type { ReviewItem } from "@/lib/queries";

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function rate(quality: 0 | 1 | 2) {
    setDone(true);
    startTransition(async () => {
      const result = await reviewTopic(item.topicId, quality);
      if (result?.error) {
        showToast(result.error);
        setDone(false);
        return;
      }
      showToast(
        result?.nextReviewDate
          ? `Next review ${new Date(result.nextReviewDate + "T00:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })} ✓`
          : REVIEW_QUALITY_LABELS[quality] + " ✓"
      );
      router.refresh();
    });
  }

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="rounded-md border-2 border-ink bg-paper-2 p-5 shadow-[4px_4px_0_0_var(--brutal-shadow)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-ink">{item.title}</div>
              <div className="mt-0.5 text-xs text-ink-3">
                {[item.phaseTitle, item.section].filter(Boolean).join(" · ")}
              </div>
            </div>
            <span className="shrink-0 rounded-sm border-2 border-ink bg-paper-3 px-2 py-1 text-[11px] font-bold text-ink-2">
              {item.reps}× reviewed
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {REVIEW_QUALITY_BUTTONS.map((b) => {
              const Icon = ICONS[b.iconKey] ?? FALLBACK_ICON;
              return (
                <button
                  key={b.quality}
                  disabled={pending}
                  onClick={() => rate(b.quality as 0 | 1 | 2)}
                  className="press-sm flex flex-1 items-center justify-center gap-1.5 rounded-md border-2 border-ink bg-paper py-2.5 text-sm font-bold text-ink"
                >
                  <Icon size={15} className="text-ink-2" /> {b.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
