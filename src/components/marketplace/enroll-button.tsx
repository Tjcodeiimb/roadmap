"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { enrollTrack, enrollCohort, unenrollTrack, leaveCohort } from "@/app/actions/enrollment";
import { useToast } from "@/components/ui/toast";
import { CheckCircleMark } from "@/components/icons";
import { valueTransition } from "@/lib/motion";

/**
 * `enrolled` is read straight from the server render rather than mirrored in
 * local state: the course and cohort detail pages each render this button
 * twice, so a local copy let the top button say "Leave" while the bottom one
 * still said "Continue". `router.refresh()` inside the transition keeps the
 * pending label up until the new server state lands, so there is no flicker
 * of the old label either.
 */
export function EnrollButton({
  kind,
  id,
  label,
  enrolled,
  continueHref,
}: {
  kind: "track" | "cohort";
  id: string;
  label: string;
  enrolled: boolean;
  continueHref: string;
}) {
  const [celebrate, setCelebrate] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  function enroll() {
    startTransition(async () => {
      const result = kind === "track" ? await enrollTrack(id) : await enrollCohort(id);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 700);
      showToast(`Enrolled in ${label} ✓`);
      router.refresh();
    });
  }

  function leave() {
    startTransition(async () => {
      const result = kind === "track" ? await unenrollTrack(id) : await leaveCohort(id);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      setConfirming(false);
      showToast(`Left ${label} — progress saved`);
      router.refresh();
    });
  }

  if (!enrolled) {
    return (
      <Button size="md" onClick={enroll} disabled={pending}>
        {pending ? "Enrolling…" : kind === "cohort" ? "Enroll in cohort" : "Enroll"}
      </Button>
    );
  }

  // Enrolled. "Continue" used to be the only thing here, which left no way
  // out of a course short of finding the small link on its own roadmap page —
  // and no way out of a bundle at all.
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={continueHref} className={buttonClassName("secondary", "md", "relative")}>
          Continue <ArrowRight size={15} />
          <AnimatePresence>
            {celebrate && (
              <motion.span
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={valueTransition}
                className="absolute -right-2 -top-2 text-success"
              >
                <CheckCircleMark size={18} />
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink"
          >
            {kind === "cohort" ? "Leave bundle" : "Leave course"}
          </button>
        )}
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-ink bg-paper-2 px-3 py-2.5">
          <span className="flex-1 text-xs font-medium text-ink-2">
            {kind === "cohort"
              ? "Leave this bundle and the courses it added? Your progress is kept."
              : "Leave this course? Your progress, XP and skills are kept."}
          </span>
          <button
            type="button"
            onClick={leave}
            disabled={pending}
            className="press-sm rounded-sm border-2 border-ink bg-danger px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {pending ? "Leaving…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-3 py-1.5 text-xs font-bold text-ink-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
