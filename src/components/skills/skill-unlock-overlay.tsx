"use client";

import { motion } from "framer-motion";
import { ICONS, FALLBACK_ICON, SparkMark } from "@/components/icons";
import { celebrateVariants, overlayVariants } from "@/lib/motion";
import { trackColor, trackInk } from "@/lib/track-colors";
import type { PendingSkillUnlock } from "@/lib/queries";

// A one-shot burst of small flat-colored squares firing outward from the
// unlock icon, cycling through several track colors rather than the
// skill's single domain color — a deliberate "lot of colours" celebration
// moment, distinct from the calmer per-track theming used everywhere else.
const CONFETTI = [
  { angle: -60, distance: 90, color: "var(--track-marketing)", delay: 0 },
  { angle: -20, distance: 100, color: "var(--track-data)", delay: 0.04 },
  { angle: 20, distance: 95, color: "var(--track-product)", delay: 0.08 },
  { angle: 60, distance: 90, color: "var(--track-people)", delay: 0.02 },
  { angle: -100, distance: 85, color: "var(--track-operations)", delay: 0.06 },
  { angle: 100, distance: 85, color: "var(--track-ux)", delay: 0.1 },
  { angle: 150, distance: 80, color: "var(--track-cybersecurity)", delay: 0.03 },
  { angle: -150, distance: 80, color: "var(--track-sustainability)", delay: 0.07 },
];

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
      {CONFETTI.map((piece, i) => {
        const rad = (piece.angle * Math.PI) / 180;
        return (
          <motion.span
            key={i}
            className="absolute h-2.5 w-2.5 rounded-sm border-2 border-ink"
            style={{ backgroundColor: piece.color }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              x: Math.cos(rad) * piece.distance,
              y: Math.sin(rad) * piece.distance,
              opacity: 0,
              rotate: 180,
            }}
            transition={{ duration: 0.6, delay: 0.15 + piece.delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4"
    >
      <motion.div
        variants={celebrateVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        className="card-shadow flex w-full max-w-sm flex-col items-center gap-3 rounded-md border-2 border-ink bg-paper p-8 text-center"
      >
        <div className="text-xs font-bold uppercase tracking-wide text-accent">Skill unlocked</div>
        <div className="relative">
          <ConfettiBurst />
          <motion.div
            initial={{ scale: 0.4, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink"
            style={{ backgroundColor: trackColor(skill.domain), color: trackInk(skill.domain) }}
          >
            <Icon size={40} />
          </motion.div>
        </div>
        <div className="font-display text-xl font-bold text-ink">{skill.name}</div>
        <div className="text-xs font-bold uppercase tracking-wide text-ink-3">{skill.domain}</div>
        {skill.description && <p className="text-sm text-ink-2">{skill.description}</p>}
        <div className="flex items-center gap-1.5 rounded-sm border-2 border-ink bg-paper-3 px-3 py-1.5 text-sm font-bold text-ink">
          <SparkMark size={15} className="text-accent" /> +{skill.xpReward} XP
        </div>
        <button
          onClick={onDismiss}
          className="mt-1 text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
        >
          Nice, continue
        </button>
      </motion.div>
    </motion.div>
  );
}
