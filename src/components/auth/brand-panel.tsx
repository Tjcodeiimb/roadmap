"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CompassMark, TargetMark, RepeatMark } from "@/components/icons";

const FEATURES = [
  { Icon: CompassMark, text: "14 curated tracks — from AI to Finance to Cybersecurity" },
  { Icon: TargetMark, text: "Earn XP, build streaks, unlock resume-ready skills" },
  { Icon: RepeatMark, text: "Spaced-repetition review keeps what you learn stuck" },
];

// The login page's brand moment: a fixed bright --login-bg panel (not
// theme-aware, unlike the form panel beside it) with floating shapes behind
// this content. Client-only for the entrance stagger; guards on
// useReducedMotion() since this sits outside AppShell's MotionConfig.
export function BrandPanel() {
  const reduced = useReducedMotion();

  return (
    <div className="relative z-10 flex h-full flex-col justify-between">
      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md border-2 border-ink bg-accent text-lg font-extrabold text-accent-ink shadow-[3px_3px_0_0_var(--brutal-shadow)]">
          UF
        </div>
        <h1
          className="font-display text-4xl font-extrabold tracking-tight md:text-5xl"
          style={{ color: "var(--login-ink)" }}
        >
          UpForge Learning
        </h1>
        <p className="mt-3 max-w-sm text-base font-bold" style={{ color: "var(--login-ink)", opacity: 0.75 }}>
          The employee training platform built for people who actually finish courses.
        </p>
      </motion.div>

      <div className="mt-10 flex flex-col gap-3">
        {FEATURES.map(({ Icon, text }, i) => (
          <motion.div
            key={text}
            initial={reduced ? undefined : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.15 + i * 0.1 }}
            className="flex items-center gap-3 rounded-md border-2 border-ink bg-paper-2 px-3 py-2.5 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-accent text-accent-ink">
              <Icon size={16} />
            </span>
            <span className="text-sm font-bold text-ink">{text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
