"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { Status } from "@/lib/database.types";
import { STATUS_LABELS } from "@/lib/gamification/constants";
import { setTopicStatus } from "@/app/actions/progress";
import { useToast } from "@/components/ui/toast";
import { SparkMark } from "@/components/icons";

const OPTIONS: Status[] = ["todo", "next", "active", "done"];

export function StatusControl({ topicId, status, path }: { topicId: string; status: Status; path: string }) {
  const [current, setCurrent] = useState(status);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function pick(next: Status) {
    if (next === current) return;
    setCurrent(next);
    if (next === "done") {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 700);
    }
    startTransition(async () => {
      const result = await setTopicStatus(topicId, next, path);
      if (result?.error) {
        showToast(result.error);
        setCurrent(status);
        return;
      }
      showToast(`${STATUS_LABELS[next]} ✓`);
      router.refresh();
    });
  }

  return (
    <div className="relative flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          disabled={pending}
          onClick={() => pick(opt)}
          className={clsx(
            "rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200",
            current === opt
              ? "border-accent bg-accent text-accent-ink"
              : "border-border bg-paper-2 text-ink-2 hover:bg-paper-3"
          )}
        >
          {STATUS_LABELS[opt]}
        </button>
      ))}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1.4 }}
            exit={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute -top-3 left-0 flex items-center gap-1.5 font-display text-lg font-bold text-accent"
          >
            <SparkMark size={20} /> +50 XP
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
