"use client";

import { motion, useReducedMotion } from "framer-motion";

// `template.tsx` remounts on every navigation (unlike layout.tsx, which
// persists), which is exactly what a page-enter transition needs.
//
// A hard-edged wipe rather than a fade: an opacity ramp is the thing that
// makes a transition read as generic, because nothing in the physical world
// dissolves. Clipping from the left keeps the edge sharp all the way across,
// which is the same logic as the press interaction — motion in this system
// shows weight, not softness. Kept to 0.28s, because on a tool people reopen
// all day a transition that lingers stops being identity and starts being
// friction.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      animate={{ clipPath: "inset(0 0% 0 0)" }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
