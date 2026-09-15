"use client";

import { motion, useReducedMotion } from "framer-motion";

// Purely decorative — bold flat shapes drifting slowly behind the login
// card, cycling through the same per-track color set used everywhere else
// in the app (src/lib/track-colors.ts) so the "lot of colours" identity
// shows up here too. Ambient background drift is exempt from the
// snappy-mechanical rule that governs interactive press feedback — this is
// scenery, not a control — but still collapses to static on
// prefers-reduced-motion.
const SHAPES: {
  kind: "square" | "circle" | "triangle";
  color: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  rotate: number;
}[] = [
  // Kept clear of the bottom ~40% of the panel, where the feature chips
  // live (see BrandPanel) — this panel is narrower than the old full-width
  // login background, so shapes need a tighter, higher-up cluster instead
  // of spreading the full height.
  { kind: "square", color: "var(--track-marketing)", top: "6%", left: "8%", size: 56, duration: 7, rotate: 12 },
  { kind: "circle", color: "var(--track-data)", top: "14%", left: "80%", size: 46, duration: 9, rotate: 0 },
  { kind: "triangle", color: "var(--track-product)", top: "48%", left: "4%", size: 42, duration: 8, rotate: -10 },
  { kind: "square", color: "var(--track-people)", top: "40%", left: "84%", size: 40, duration: 6.5, rotate: -18 },
  { kind: "circle", color: "var(--track-operations)", top: "2%", left: "46%", size: 30, duration: 10, rotate: 0 },
  { kind: "square", color: "var(--track-ux)", top: "34%", left: "6%", size: 32, duration: 8.5, rotate: 8 },
  { kind: "circle", color: "var(--track-cybersecurity)", top: "24%", left: "62%", size: 34, duration: 9.5, rotate: 0 },
];

function Shape({ shape, index }: { shape: (typeof SHAPES)[number]; index: number }) {
  const reduced = useReducedMotion();
  const common = {
    position: "absolute" as const,
    top: shape.top,
    left: shape.left,
    width: shape.size,
    height: shape.size,
  };

  const animate = reduced
    ? undefined
    : {
        y: [0, -18, 0, 14, 0],
        x: [0, 10, 0, -10, 0],
        rotate: [shape.rotate, shape.rotate + 10, shape.rotate, shape.rotate - 10, shape.rotate],
      };
  const transition = reduced
    ? undefined
    : { duration: shape.duration, repeat: Infinity, ease: "easeInOut" as const, delay: index * 0.3 };

  if (shape.kind === "circle") {
    return (
      <motion.div
        style={{ ...common, borderRadius: "9999px", backgroundColor: shape.color, border: "3px solid var(--ink)" }}
        initial={{ rotate: shape.rotate }}
        animate={animate}
        transition={transition}
      />
    );
  }
  if (shape.kind === "triangle") {
    return (
      <motion.div
        style={{
          ...common,
          backgroundColor: shape.color,
          border: "3px solid var(--ink)",
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }}
        initial={{ rotate: shape.rotate }}
        animate={animate}
        transition={transition}
      />
    );
  }
  return (
    <motion.div
      style={{ ...common, borderRadius: "8px", backgroundColor: shape.color, border: "3px solid var(--ink)" }}
      initial={{ rotate: shape.rotate }}
      animate={animate}
      transition={transition}
    />
  );
}

export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <Shape key={i} shape={shape} index={i} />
      ))}
    </div>
  );
}
