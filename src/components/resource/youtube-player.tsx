"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeIframeAPI, YT_PLAYER_STATE, type YTPlayer } from "@/lib/youtube";
import { updateResourceProgress } from "@/app/actions/resource-progress";

// Below this, an accumulated tick is discarded rather than counted — it's
// either a scrub (seek forward/back) or a stall, not real watch time. Above
// it, the flush cadence caps how often we write.
const MAX_VALID_TICK_SECONDS = 2;
const FLUSH_THRESHOLD_SECONDS = 15;
const COMPLETE_FRACTION = 0.9;

export function YoutubePlayer({
  resourceId,
  videoId,
  initialPositionSeconds,
  initialSecondsWatched,
  onBlocked,
  onUnlockedSkills,
}: {
  resourceId: string;
  videoId: string;
  initialPositionSeconds: number;
  initialSecondsWatched: number;
  onBlocked?: () => void;
  onUnlockedSkills?: (ids: string[]) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const lastTimeRef = useRef(initialPositionSeconds);
  const totalWatchedRef = useRef(initialSecondsWatched);
  const unflushedRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;

    function stopTicking() {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    }

    async function flush(complete: boolean) {
      // Hold the pending seconds until the write actually lands. Zeroing first
      // meant a failed flush (offline, expired session) silently threw away
      // that watch time for good, since the RPC keeps greatest(existing, new).
      const pending = unflushedRef.current;
      unflushedRef.current = 0;
      const result = await updateResourceProgress(
        resourceId,
        Math.round(lastTimeRef.current),
        Math.round(totalWatchedRef.current),
        complete
      );
      if (!result.success) {
        unflushedRef.current += pending;
        return;
      }
      if (result.unlockedSkillIds.length) {
        onUnlockedSkills?.(result.unlockedSkillIds);
      }
    }

    function tick() {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime();
      const delta = current - lastTimeRef.current;
      if (delta > 0 && delta <= MAX_VALID_TICK_SECONDS) {
        totalWatchedRef.current += delta;
        unflushedRef.current += delta;
      }
      lastTimeRef.current = current;

      const duration = player.getDuration();
      if (!completedRef.current && duration > 0 && current / duration >= COMPLETE_FRACTION) {
        completedRef.current = true;
        void flush(true);
        return;
      }
      if (unflushedRef.current >= FLUSH_THRESHOLD_SECONDS) {
        void flush(false);
      }
    }

    function startTicking() {
      stopTicking();
      tickRef.current = setInterval(tick, 1000);
    }

    function beaconFlush() {
      if (typeof navigator.sendBeacon !== "function") return;
      const payload = JSON.stringify({
        resourceId,
        position: Math.round(lastTimeRef.current),
        watched: Math.round(totalWatchedRef.current),
      });
      navigator.sendBeacon("/api/resource-progress", new Blob([payload], { type: "application/json" }));
      unflushedRef.current = 0;
    }

    function handleVisibility() {
      if (document.hidden) beaconFlush();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", beaconFlush);

    loadYouTubeIframeAPI().then((YT) => {
      if (destroyed || !mountRef.current) return;
      // Hand YT a disposable inner node, never the element React is tracking:
      // YT.Player replaces its target with an iframe and destroy() removes it,
      // which made React unmount throw NotFoundError/removeChild. That path is
      // reachable — onError -> onBlocked() swaps this whole subtree out, which
      // is exactly what happens on embed-disabled or region-locked videos.
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady(event) {
            const duration = event.target.getDuration();
            if (initialPositionSeconds > 0 && (!duration || initialPositionSeconds / duration < 0.95)) {
              event.target.seekTo(initialPositionSeconds, true);
            }
            setReady(true);
          },
          onStateChange(event) {
            if (event.data === YT_PLAYER_STATE.PLAYING) {
              startTicking();
            } else {
              stopTicking();
              if (event.data === YT_PLAYER_STATE.ENDED) {
                completedRef.current = true;
                void flush(true);
              } else if (event.data === YT_PLAYER_STATE.PAUSED) {
                void flush(false);
              }
            }
          },
          onError() {
            onBlocked?.();
          },
        },
      });
    });

    return () => {
      destroyed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", beaconFlush);
      stopTicking();
      beaconFlush();
      playerRef.current?.destroy();
    };
    // Re-running on every prop change would tear down and recreate the
    // embed; the player only needs to mount once per resource.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId, videoId]);

  return (
    <div className="overflow-hidden rounded-md border-2 border-ink bg-black shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <div className="relative aspect-video w-full">
        <div ref={hostRef} className="absolute inset-0 h-full w-full">
          <div ref={mountRef} className="h-full w-full" />
        </div>
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
            Loading player…
          </div>
        )}
      </div>
    </div>
  );
}
