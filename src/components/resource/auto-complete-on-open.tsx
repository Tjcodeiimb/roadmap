"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { completeResource } from "@/app/actions/resource-progress";

/**
 * Opening a resource is what counts as finishing it — there are no manual
 * status controls any more.
 *
 * This deliberately runs in an effect rather than during the page's server
 * render: Next.js prefetches links on hover, and a server-side write would
 * mark resources complete that the learner only ever hovered over. Effects
 * don't run for a prefetch, so the write happens on a real visit only.
 */
export function AutoCompleteOnOpen({
  resourceId,
  alreadyDone,
}: {
  resourceId: string;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (alreadyDone || fired.current) return;
    fired.current = true;
    completeResource(resourceId).then((result) => {
      // Refresh so the topic/track colours behind this page reflect the
      // completion the moment the learner navigates back.
      if (result.success) router.refresh();
    });
  }, [resourceId, alreadyDone, router]);

  return null;
}
