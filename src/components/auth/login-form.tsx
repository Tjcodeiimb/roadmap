"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputWrapperClassName, inputFieldClassName } from "@/components/ui/input";
import { signInWithPassword, sendMagicLink } from "@/app/actions/auth";
import { MailMark } from "@/components/icons";

type Mode = "password" | "magic-link";

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    if (mode === "password") {
      const result = await signInWithPassword(formData);
      if (result?.error) setError(result.error);
    } else {
      const result = await sendMagicLink(formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <MailMark size={40} className="mx-auto mb-3 text-accent" />
        <h2 className="font-display text-xl font-semibold text-ink">Check your email</h2>
        <p className="mt-2 text-sm text-ink-2">
          We sent a sign-in link. Open it on this device to continue.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      action={(fd) => startTransition(() => handleSubmit(fd))}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-2">Email</span>
        <div className={inputWrapperClassName()}>
          <Mail size={16} className="text-ink-3" />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@upforge.com"
            className={inputFieldClassName()}
          />
        </div>
      </label>

      {mode === "password" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-2">Password</span>
          <div className={inputWrapperClassName()}>
            <Lock size={16} className="text-ink-3" />
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={inputFieldClassName()}
            />
          </div>
        </label>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? "Please wait…" : mode === "password" ? "Sign in" : "Email me a link"}
        <ArrowRight size={16} />
      </Button>

      <button
        type="button"
        onClick={() => {
          setError(null);
          setMode(mode === "password" ? "magic-link" : "password");
        }}
        className="text-center text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
      >
        {mode === "password" ? "Use a sign-in link instead" : "Use a password instead"}
      </button>
    </form>
  );
}
