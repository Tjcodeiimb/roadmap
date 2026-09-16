"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CompassMark, TargetMark, RepeatMark } from "@/components/icons";

const FEATURES = [
  { Icon: CompassMark, text: "14 curated tracks — AI, Finance, Consulting, and more" },
  { Icon: TargetMark, text: "Earn XP, build streaks, unlock resume-ready skills" },
  { Icon: RepeatMark, text: "Spaced-repetition review keeps what you learn stuck" },
];

const STATS = [
  { value: "14", label: "Tracks" },
  { value: "500+", label: "Resources" },
  { value: "50+", label: "Skills" },
];

const TRACK_NAMES = [
  "AI & Machine Learning",
  "Financial Modelling",
  "Strategy Consulting",
  "Excel & Business Modelling",
  "Behavioral Psychology",
  "Growth & Marketing",
  "Data & Analytics",
  "Product Strategy",
  "B2B Sales",
  "UX & Discovery",
  "Operations & Process",
  "Cybersecurity & Risk",
  "People & Org Design",
];

export function BrandPanel() {
  const reduced = useReducedMotion();

  const marqueeContent = [...TRACK_NAMES, ...TRACK_NAMES].join("  ·  ");

  return (
    <div className="relative z-10 flex h-full flex-col gap-8">
      {/* Headline block */}
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

      {/* Stats row */}
      <motion.div
        initial={reduced ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="flex gap-4"
      >
        {STATS.map(({ value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-md border-2 border-ink bg-ink px-4 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,0.25)]"
          >
            <span className="font-display text-2xl font-extrabold text-paper">{value}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-paper" style={{ opacity: 0.7 }}>{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Feature cards */}
      <div className="flex flex-col gap-3">
        {FEATURES.map(({ Icon, text }, i) => (
          <motion.div
            key={text}
            initial={reduced ? undefined : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3 rounded-md border-2 border-ink bg-paper-2 px-3 py-2.5 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border-2 border-ink bg-accent text-accent-ink">
              <Icon size={16} />
            </span>
            <span className="text-sm font-bold text-ink">{text}</span>
          </motion.div>
        ))}
      </div>

      {/* Track name marquee — scrolls at the bottom of the panel */}
      {!reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-auto overflow-hidden border-y-2 border-ink py-2"
          style={{ borderColor: "color-mix(in srgb, var(--login-ink) 30%, transparent)" }}
          aria-hidden
        >
          <div
            className="flex whitespace-nowrap text-[11px] font-bold uppercase tracking-widest"
            style={{
              color: "var(--login-ink)",
              opacity: 0.55,
              animation: "marquee 28s linear infinite",
            }}
          >
            <span className="pr-8">{marqueeContent}</span>
            <span className="pr-8">{marqueeContent}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
