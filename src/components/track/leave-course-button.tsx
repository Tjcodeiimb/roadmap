"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unenrollTrack } from "@/app/actions/enrollment";
import { useToast } from "@/components/ui/toast";

export function LeaveCourseButton({ trackId, trackLabel }: { trackId: string; trackLabel: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function leave() {
    startTransition(async () => {
      const result = await unenrollTrack(trackId);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Left ${trackLabel}`);
      router.push("/dashboard");
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-ink-2">Leave this course? Your progress is saved.</span>
        <button
          onClick={leave}
          disabled={pending}
          className="press-sm rounded-sm border-2 border-ink bg-danger px-2.5 py-1 font-bold text-white"
        >
          {pending ? "Leaving…" : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-2.5 py-1 font-bold text-ink-2">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs font-bold text-ink-3 underline decoration-2 underline-offset-4 hover:text-ink">
      Leave course
    </button>
  );
}
