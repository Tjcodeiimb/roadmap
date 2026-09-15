"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { inviteEmployee } from "@/app/actions/admin";
import { useToast } from "@/components/ui/toast";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteEmployee(email, fullName);
      if (result?.error) {
        setError(result.error);
        return;
      }
      showToast(`Invited ${email} ✓`);
      setEmail("");
      setFullName("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        required
        className="flex-1 rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="name@upforge.com"
        required
        className="flex-1 rounded-md border-2 border-ink bg-paper px-3 py-2 text-sm font-medium outline-none"
      />
      <Button type="submit" size="md" disabled={pending}>
        {pending ? "Inviting…" : "Send invite"}
      </Button>
      {error && <p className="text-sm text-danger sm:basis-full">{error}</p>}
    </form>
  );
}
