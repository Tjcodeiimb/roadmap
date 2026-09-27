"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTrack } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";

export function CreateTrackForm() {
  const [label, setLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTrack(label);
      if (result?.error) {
        setError(result.error);
        return;
      }
      showToast(`Created ${label} ✓`);
      setLabel("");
      router.refresh();
      if (result.id) router.push(`/admin/content/${result.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Course name"
        required
        className="flex-1 rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
      />
      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Creating…" : "Create course"}
      </Button>
      {error && <p className="text-sm text-danger sm:basis-full">{error}</p>}
    </form>
  );
}
