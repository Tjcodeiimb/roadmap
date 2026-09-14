"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircleMark, ExternalMark } from "@/components/icons";
import { completeResource } from "@/app/actions/resource-progress";
import { useToast } from "@/components/ui/toast";

export function ResourceCompleteButton({
  resourceId,
  url,
  done: initialDone,
  onUnlockedSkills,
}: {
  resourceId: string;
  url: string;
  done: boolean;
  onUnlockedSkills?: (ids: string[]) => void;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function markComplete() {
    startTransition(async () => {
      const result = await completeResource(resourceId);
      if (!result.success) {
        showToast(result.error ?? "Something went wrong");
        return;
      }
      setDone(true);
      showToast("Marked complete ✓");
      if (result.unlockedSkillIds.length) onUnlockedSkills?.(result.unlockedSkillIds);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-paper-2 p-6">
      <p className="text-sm text-ink-2">
        This resource can&apos;t be played inline — open it in a new tab, then mark it complete here.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-border bg-paper-3 px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-paper"
      >
        Open resource <ExternalMark size={15} />
      </a>
      {done ? (
        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <CheckCircleMark size={16} /> Completed
        </div>
      ) : (
        <Button variant="secondary" onClick={markComplete} disabled={pending}>
          {pending ? "Marking…" : "Mark as complete"}
        </Button>
      )}
    </div>
  );
}
