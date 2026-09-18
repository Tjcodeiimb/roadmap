"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button, buttonClassName } from "@/components/ui/button";
import { enrollTrack, enrollCohort } from "@/app/actions/enrollment";
import { useToast } from "@/components/ui/toast";
import { CheckCircleMark } from "@/components/icons";
import { valueTransition } from "@/lib/motion";

export function EnrollButton({
  kind,
  id,
  label,
  enrolled: initialEnrolled,
  continueHref,
}: {
  kind: "track" | "cohort";
  id: string;
  label: string;
  enrolled: boolean;
  continueHref: string;
}) {
  const [enrolled, setEnrolled] = useState(initialEnrolled);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  function enroll() {
    startTransition(async () => {
      const result = kind === "track" ? await enrollTrack(id) : await enrollCohort(id);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      setEnrolled(true);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 700);
      showToast(`Enrolled in ${label} ✓`);
    });
  }

  if (enrolled) {
    return (
      <Link href={continueHref} className={buttonClassName("secondary", "md", "relative")}>
        Continue <ArrowRight size={15} />
        <AnimatePresence>
          {celebrate && (
            <motion.span
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={valueTransition}
              className="absolute -right-2 -top-2 text-success"
            >
              <CheckCircleMark size={18} />
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  }

  return (
    <Button size="md" onClick={enroll} disabled={pending}>
      {pending ? "Enrolling…" : kind === "cohort" ? "Enroll in cohort" : "Enroll"}
    </Button>
  );
}
