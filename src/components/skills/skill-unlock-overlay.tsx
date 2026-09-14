"use client";

import { motion } from "framer-motion";
import { ICONS, FALLBACK_ICON, SparkMark } from "@/components/icons";
import { celebrateVariants, overlayVariants } from "@/lib/motion";
import type { PendingSkillUnlock } from "@/lib/queries";

export function SkillUnlockOverlay({
  skill,
  onDismiss,
}: {
  skill: PendingSkillUnlock;
  onDismiss: () => void;
}) {
  const Icon = ICONS[skill.iconKey ?? ""] ?? FALLBACK_ICON;

  return (
    <motion.div
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onDismiss}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      <motion.div
        variants={celebrateVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="card-shadow flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-border bg-paper p-8 text-center"
      >
        <div className="text-xs font-semibold uppercase tracking-wide text-accent">Skill unlocked</div>
        <motion.div
          initial={{ scale: 0.4, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft text-accent"
        >
          <Icon size={40} />
        </motion.div>
        <div className="font-display text-xl font-bold text-ink">{skill.name}</div>
        <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{skill.domain}</div>
        {skill.description && <p className="text-sm text-ink-2">{skill.description}</p>}
        <div className="flex items-center gap-1.5 rounded-full bg-paper-3 px-3 py-1.5 text-sm font-semibold text-ink">
          <SparkMark size={15} className="text-accent" /> +{skill.xpReward} XP
        </div>
        <button
          onClick={onDismiss}
          className="mt-1 text-sm font-medium text-ink-2 underline decoration-border underline-offset-4 hover:text-ink"
        >
          Nice, continue
        </button>
      </motion.div>
    </motion.div>
  );
}
