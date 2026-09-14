"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const controls = animate(prev.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(v) {
        el.textContent = Math.round(v).toLocaleString();
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}
