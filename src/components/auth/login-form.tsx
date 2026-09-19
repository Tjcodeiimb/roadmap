"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputWrapperClassName, inputFieldClassName } from "@/components/ui/input";
import { signInWithPassword, sendMagicLink, signUpWithPassword } from "@/app/actions/auth";
import { MailMark } from "@/components/icons";

type Mode = "password" | "magic-link" | "signup";

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
    } else if (mode === "signup") {
      const result = await signUpWithPassword(formData);
      if (result?.error) setError(result.error);
      else if (result?.sent) setSent(true);
    } else {
      const result = await sendMagicLink(formData);
      if (result?.error) setError(result.error);
      else setSent(true);
    }
  }

  function switchMode(next: Mode) {
    setError(null);
    setSent(false);
    setMode(next);
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
          {mode === "signup"
            ? "We sent a confirmation link. Open it to activate your account."
            : "We sent a sign-in link. Open it on this device to continue."}
        </p>
        <button
          type="button"
          onClick={() => switchMode("password")}
          className="mt-4 text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
        >
          Back to sign in
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Sign in / Create account tabs */}
      <div className="flex gap-1 rounded-md border-2 border-ink bg-paper-3 p-1">
        {(["password", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-sm py-1.5 text-sm font-bold transition-colors ${
              (mode === m || (mode === "magic-link" && m === "password"))
                ? "bg-ink text-paper"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            {m === "password" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          action={(fd) => startTransition(() => handleSubmit(fd))}
          className="flex flex-col gap-4"
        >
          {/* Email — always shown */}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-2">Email</span>
            <div className={inputWrapperClassName()}>
              <Mail size={16} className="text-ink-3" />
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className={inputFieldClassName()}
              />
            </div>
          </label>

          {/* Password — shown for sign-in and signup */}
          {(mode === "password" || mode === "signup") && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Password</span>
              <div className={inputWrapperClassName()}>
                <Lock size={16} className="text-ink-3" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className={inputFieldClassName()}
                />
              </div>
            </label>
          )}

          {/* Confirm password — signup only */}
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink-2">Confirm password</span>
              <div className={inputWrapperClassName()}>
                <Lock size={16} className="text-ink-3" />
                <input
                  type="password"
                  name="confirm"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={inputFieldClassName()}
                />
              </div>
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
            {pending
              ? "Please wait…"
              : mode === "password"
              ? "Sign in"
              : mode === "signup"
              ? "Create account"
              : "Email me a link"}
            {mode === "signup" ? <UserPlus size={16} /> : <ArrowRight size={16} />}
          </Button>

          {/* Toggle between password sign-in and magic link */}
          {mode === "password" && (
            <button
              type="button"
              onClick={() => switchMode("magic-link")}
              className="text-center text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
            >
              Use a sign-in link instead
            </button>
          )}
          {mode === "magic-link" && (
            <button
              type="button"
              onClick={() => switchMode("password")}
              className="text-center text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
            >
              Use a password instead
            </button>
          )}
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
