"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLeaderboardOptIn } from "@/app/actions/progress";

export function LeaderboardOptIn({ initial }: { initial: boolean }) {
  const [optIn, setOptIn] = useState(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !optIn;
    setOptIn(next);
    startTransition(async () => {
      await toggleLeaderboardOptIn(next);
      router.refresh();
    });
  }

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-paper px-4 py-3">
      <div>
        <div className="text-sm font-medium text-ink">Appear on the team leaderboard</div>
        <div className="text-xs text-ink-3">Off by default. Shows your name, XP and streak to teammates.</div>
      </div>
      <button
        role="switch"
        aria-checked={optIn}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          optIn ? "bg-accent" : "bg-paper-3"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            optIn ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
