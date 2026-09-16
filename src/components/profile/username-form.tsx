"use client";

import { useState, useTransition } from "react";
import { AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputWrapperClassName, inputFieldClassName } from "@/components/ui/input";
import { updateUsername } from "@/app/actions/auth";

export function UsernameForm({ current }: { current: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    const result = await updateUsername(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Username</div>
          <div className="mt-0.5 font-mono text-sm font-bold text-ink">@{current}</div>
          {success && <div className="mt-0.5 text-xs text-success">Saved!</div>}
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <form
      action={(fd) => startTransition(() => handleSubmit(fd))}
      className="flex flex-col gap-2"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-3">New username</span>
        <div className={inputWrapperClassName()}>
          <AtSign size={15} className="text-ink-3" />
          <input
            type="text"
            name="username"
            required
            autoComplete="off"
            defaultValue={current}
            placeholder="your_handle"
            pattern="^[a-zA-Z][a-zA-Z0-9_]{2,29}$"
            title="3–30 characters, starts with a letter, letters/numbers/underscores only"
            className={inputFieldClassName()}
          />
        </div>
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => { setEditing(false); setError(null); }}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
