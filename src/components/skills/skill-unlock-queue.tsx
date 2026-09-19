"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SkillUnlockOverlay } from "./skill-unlock-overlay";
import { ackSkills } from "@/app/actions/skills";
import type { PendingSkillUnlock } from "@/lib/queries";

const DISPLAY_MS = 3200;

// Mounted once in AppShell. `pending` is refetched by the server on every
// navigation/router.refresh() — new arrivals are merged into the queue and
// acked here so the celebration fires whether the unlock came from this
// tab's own action or from the safety-net fetch on the next page load.
export function SkillUnlockQueue({ pending }: { pending: PendingSkillUnlock[] }) {
  const [queue, setQueue] = useState<PendingSkillUnlock[]>([]);
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fresh = pending.filter((s) => !seenIds.current.has(s.skillId));
    if (!fresh.length) return;
    for (const s of fresh) seenIds.current.add(s.skillId);
    setQueue((q) => [...q, ...fresh]);
  }, [pending]);

  // Acknowledge a skill only once its celebration has actually been shown.
  // Acking at queue time stamped seen_at before the animation ran, so closing
  // the tab mid-celebration consumed it forever — exactly what the pending
  // safety net exists to prevent.
  function dismissCurrent() {
    setQueue((q) => {
      const [shown, ...rest] = q;
      if (shown) void ackSkills([shown.skillId]);
      return rest;
    });
  }

  useEffect(() => {
    if (!queue.length) return;
    const timer = setTimeout(dismissCurrent, DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [queue]);

  const current = queue[0];

  return (
    <AnimatePresence>
      {current && (
        <SkillUnlockOverlay key={current.skillId} skill={current} onDismiss={dismissCurrent} />
      )}
    </AnimatePresence>
  );
}
