"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { YoutubePlayer } from "./youtube-player";
import { ResourceCompleteButton } from "./resource-complete-button";
import { useToast } from "@/components/ui/toast";

// Plenty of YouTube videos are embed-disabled or region-locked, so the
// player degrading to "open on YouTube + mark complete" is required, not
// optional. `blocked` starts true for anything that was never embeddable in
// the first place, and flips true on an embed error.
export function ResourcePlayer({
  resourceId,
  url,
  embeddable,
  provider,
  externalId,
  initialPositionSeconds,
  initialSecondsWatched,
  done,
}: {
  resourceId: string;
  url: string;
  embeddable: boolean;
  provider: string | null;
  externalId: string | null;
  initialPositionSeconds: number;
  initialSecondsWatched: number;
  done: boolean;
}) {
  const canEmbed = embeddable && provider === "youtube" && !!externalId;
  const [blocked, setBlocked] = useState(!canEmbed);
  const router = useRouter();
  const { showToast } = useToast();

  function handleUnlockedSkills(ids: string[]) {
    router.refresh();
    if (ids.length === 1) showToast("New skill unlocked! ✓");
    else if (ids.length > 1) showToast(`${ids.length} new skills unlocked! ✓`);
  }

  if (!blocked && externalId) {
    return (
      <YoutubePlayer
        resourceId={resourceId}
        videoId={externalId}
        initialPositionSeconds={initialPositionSeconds}
        initialSecondsWatched={initialSecondsWatched}
        onBlocked={() => setBlocked(true)}
        onUnlockedSkills={handleUnlockedSkills}
      />
    );
  }

  return (
    <ResourceCompleteButton
      resourceId={resourceId}
      url={url}
      done={done}
      onUnlockedSkills={handleUnlockedSkills}
    />
  );
}
