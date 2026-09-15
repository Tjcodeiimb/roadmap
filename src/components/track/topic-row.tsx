"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { listReveal } from "@/lib/motion";
import type { Status } from "@/lib/database.types";

export function TopicRow({
  href,
  title,
  status,
  estimatedTime,
  index,
}: {
  href: string;
  title: string;
  status: Status;
  estimatedTime: string | null;
  index: number;
}) {
  return (
    <motion.div {...listReveal(index)}>
      <Link
        href={href}
        className="press-sm group flex items-center gap-4 rounded-md border-2 border-ink bg-paper-2 px-4 py-3.5 shadow-[3px_3px_0_0_var(--brutal-shadow)]"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-ink">{title}</div>
          {estimatedTime && <div className="text-xs text-ink-3">{estimatedTime} estimated</div>}
        </div>
        <StatusBadge status={status} />
        <ChevronRight size={16} className="shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </motion.div>
  );
}
