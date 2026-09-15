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
  { kind: "square", color: "var(--track-marketing)", top: "8%", left: "10%", size: 64, duration: 7, rotate: 12 },
  { kind: "circle", color: "var(--track-data)", top: "18%", left: "82%", size: 52, duration: 9, rotate: 0 },
  { kind: "triangle", color: "var(--track-product)", top: "70%", left: "6%", size: 70, duration: 8, rotate: -10 },
  { kind: "square", color: "var(--track-people)", top: "78%", left: "80%", size: 46, duration: 6.5, rotate: -18 },
  { kind: "circle", color: "var(--track-operations)", top: "4%", left: "48%", size: 34, duration: 10, rotate: 0 },
  { kind: "triangle", color: "var(--track-cybersecurity)", top: "88%", left: "45%", size: 44, duration: 7.5, rotate: 20 },
  { kind: "square", color: "var(--track-ux)", top: "42%", left: "4%", size: 38, duration: 8.5, rotate: 8 },
  { kind: "circle", color: "var(--track-sustainability)", top: "38%", left: "90%", size: 40, duration: 9.5, rotate: 0 },
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
