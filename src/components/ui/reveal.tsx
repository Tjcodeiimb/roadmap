"use client";

import { motion } from "framer-motion";
import { listReveal } from "@/lib/motion";

/**
 * Wraps server-rendered content in a scroll-in stagger reveal, without
 * requiring the content itself to become a client component — the parent
 * stays a plain server component and just passes its JSX as children.
 */
export function Reveal({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div className={className} {...listReveal(index)}>
      {children}
    </motion.div>
  );
}
