"use client";

import { motion } from "framer-motion";
import { uiTransition } from "@/lib/motion";

// `template.tsx` remounts on every navigation (unlike layout.tsx, which
// persists), which is exactly what a page-enter transition needs.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={uiTransition}>
      {children}
    </motion.div>
  );
}
