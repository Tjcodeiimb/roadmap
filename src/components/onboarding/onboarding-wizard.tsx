"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectTracks } from "@/app/actions/progress";
import { ICONS, FALLBACK_ICON, SignalMark } from "@/components/icons";

interface TrackOption {
  id: string;
  label: string;
}

export function OnboardingWizard({ tracks }: { tracks: TrackOption[] }) {
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function finish() {
    startTransition(async () => {
      await selectTracks(chosen.length ? chosen : tracks.map((t) => t.id));
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step ? "w-8 bg-accent" : "w-1.5 bg-paper-3"
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
          <Screen key="tracks">
            <h2 className="font-display text-2xl font-bold text-ink">Pick your track</h2>
            <p className="mt-2 text-sm text-ink-2">
              Choose one or more. You can switch or add tracks anytime.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {tracks.map((t) => {
                const Icon = ICONS[t.id] ?? FALLBACK_ICON;
                const active = chosen.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors duration-150 ${
                      active ? "border-accent bg-accent-soft" : "border-border bg-paper-2 hover:bg-paper-3"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="flex-1 font-medium text-ink">{t.label}</span>
                    {active && <Check size={18} className="text-accent" />}
                  </button>
                );
              })}
            </div>
            <Button size="lg" className="mt-8 w-full" onClick={() => setStep(2)} disabled={!chosen.length}>
              Continue <ArrowRight size={16} />
            </Button>
          </Screen>
        )}

        {step === 2 && (
          <Screen key="how">
            <h2 className="font-display text-2xl font-bold text-ink">How it works</h2>
            <div className="mt-6 flex flex-col gap-4">
              <HowItem iconKey="bolt" title="Earn XP" desc="Complete topics to level up. Progress is saved to your account automatically." />
              <HowItem iconKey="streak" title="Build a streak" desc="Visit most days to keep your streak alive." />
              <HowItem iconKey="repeat" title="Spaced review" desc="Finished topics resurface for a quick review, right when you're about to forget them." />
            </div>
            <Button size="lg" className="mt-8 w-full" disabled={pending} onClick={finish}>
              {pending ? "Setting up…" : "Go to dashboard"} <ArrowRight size={16} />
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
      className="card-shadow rounded-2xl border border-border bg-paper-2 p-8 text-center"
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
