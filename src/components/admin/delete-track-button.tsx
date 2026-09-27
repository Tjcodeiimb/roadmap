"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTrack } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";

export function DeleteTrackButton({ trackId, label }: { trackId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteTrack(trackId);
      if (result?.error) {
        showToast(result.error);
        setConfirming(false);
        return;
      }
      showToast(`Deleted ${label}`);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleClick}
      onBlur={() => setConfirming(false)}
      className="press-sm rounded-sm border-2 border-ink bg-paper px-2 py-1 text-xs font-bold text-danger"
    >
      {pending ? "Deleting…" : confirming ? "Confirm delete?" : "Delete course"}
    </button>
  );
}
