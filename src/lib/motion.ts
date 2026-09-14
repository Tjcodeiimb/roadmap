import type { Transition, Variants } from "framer-motion";

// The motion language already established in Phase 1, written down once
// instead of re-typed at each call site. Durations and easing here are the
// values the existing components were built with — changing them changes
// the feel of the whole app.

export const EASE = "easeOut" as const;

export const DUR = {
  /** UI transitions: toasts, tabs, overlays, step changes. */
  ui: 0.25,
  /** List and card reveals on scroll. */
  list: 0.3,
  /** Value changes and celebrations: count-ups, rings, unlocks. */
  value: 0.7,
} as const;

/** The one spring in the system — the mobile navigation drawer. */
export const DRAWER_SPRING: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
};

export const uiTransition: Transition = { duration: DUR.ui, ease: EASE };
export const valueTransition: Transition = { duration: DUR.value, ease: EASE };

/**
 * Scroll-reveal for items in a list. The stagger is capped so the ninth
 * item onward doesn't feel progressively laggier on long pages.
 */
export function listReveal(index: number) {
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: {
      duration: DUR.list,
      ease: EASE,
      delay: Math.min(index, 8) * 0.04,
    },
  } as const;
}

/** Enter/exit for an overlay or modal surface. */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: uiTransition },
  exit: { opacity: 0, transition: uiTransition },
};

/** Enter/exit for a celebratory badge — used by level-up and skill unlock. */
export const celebrateVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: valueTransition },
  exit: { opacity: 0, scale: 0.95, transition: uiTransition },
};

/** Stroke draw-on for the geometric icon marks. */
export const drawOn = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: DUR.value, ease: EASE },
} as const;
