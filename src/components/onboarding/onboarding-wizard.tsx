"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/app/actions/progress";
import { ICONS, FALLBACK_ICON, SignalMark } from "@/components/icons";

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function finish() {
    startTransition(async () => {
      await completeOnboarding();
      router.push("/marketplace");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center gap-1.5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-sm border-2 border-ink transition-all duration-300 ${
              i === step ? "w-8 bg-accent" : "w-2 bg-paper-3"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Screen key="welcome">
            <SignalMark size={44} className="mx-auto mb-5 text-accent" />
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
              Welcome to UpForge Learning
            </h1>
            <p className="mt-3 text-base text-ink-2">
              A self-paced way to build real skills. No deadlines, no fixed
              schedule — just steady progress, tracked for you.
            </p>
            <Button size="lg" className="mt-8 w-full" onClick={() => setStep(1)}>
              Get started <ArrowRight size={16} />
            </Button>
          </Screen>
        )}

        {step === 1 && (
          <Screen key="how">
            <h2 className="font-display text-2xl font-bold text-ink">How it works</h2>
            <div className="mt-6 flex flex-col gap-4">
              <HowItem
                iconKey="course"
                title="Browse the marketplace"
                desc="Enroll in individual courses, or a curated cohort bundle that strings a few together."
              />
              <HowItem iconKey="bolt" title="Earn XP" desc="Complete topics to level up. Progress is saved to your account automatically." />
              <HowItem iconKey="streak" title="Build a streak" desc="Visit most days to keep your streak alive." />
              <HowItem iconKey="repeat" title="Spaced review" desc="Finished topics resurface for a quick review, right when you're about to forget them." />
            </div>
            <Button size="lg" className="mt-8 w-full" disabled={pending} onClick={finish}>
              {pending ? "Setting up…" : "Browse the marketplace"} <ArrowRight size={16} />
            </Button>
          </Screen>
        )}
      </AnimatePresence>
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card-shadow rounded-md border-2 border-ink bg-paper-2 p-8 text-center"
    >
      {children}
    </motion.div>
  );
}

function HowItem({ iconKey, title, desc }: { iconKey: string; title: string; desc: string }) {
  const Icon = ICONS[iconKey] ?? FALLBACK_ICON;
  return (
    <div className="flex items-start gap-3 text-left">
      <Icon size={22} className="mt-0.5 shrink-0 text-accent" />
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-sm text-ink-2">{desc}</div>
      </div>
    </div>
  );
}
