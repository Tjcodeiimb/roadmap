"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTrack } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";

export function TrackNameEditor({ trackId, initialLabel }: { trackId: string; initialLabel: string }) {
  const [label, setLabel] = useState(initialLabel);
  const router = useRouter();
  const { showToast } = useToast();

  async function save() {
    if (label === initialLabel || !label.trim()) return;
    const result = await updateTrack(trackId, { label });
    if (result?.error) {
      showToast(result.error);
      setLabel(initialLabel);
      return;
    }
    router.refresh();
  }

  return (
    <input
      value={label}
      onChange={(e) => setLabel(e.target.value)}
      onBlur={save}
      className="w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 font-display text-2xl font-extrabold tracking-tight text-ink outline-none"
    />
  );
}
