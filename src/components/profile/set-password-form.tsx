"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setPassword } from "@/app/actions/auth";
import { useToast } from "@/components/ui/toast";

export function SetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          const result = await setPassword(fd);
          if (result?.error) setError(result.error);
          else showToast("Password set ✓");
        })
      }
      className="flex flex-col gap-2 rounded-xl border border-border bg-paper p-4"
    >
      <label className="text-sm font-medium text-ink">Set a password</label>
      <p className="text-xs text-ink-3">Optional — sign-in links always work even without one.</p>
      <input
        type="password"
        name="password"
        minLength={8}
        placeholder="At least 8 characters"
        className="rounded-lg border border-border bg-paper-2 px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button size="sm" type="submit" disabled={pending} className="self-start">
        Save password
      </Button>
    </form>
  );
}
