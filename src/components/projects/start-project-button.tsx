"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { startProject } from "@/app/actions/projects";

/**
 * Starting a project asks for a title first. The title is what will appear on
 * a CV, so prompting for it here is the cheapest possible nudge towards
 * "Capital structure of Indian NBFCs" rather than "Thesis".
 */
export function StartProjectButton({
  playbookId,
  playbookLabel,
  placeholder,
  size = "lg",
}: {
  playbookId: string;
  playbookLabel: string;
  placeholder: string;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [naming, setNaming] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function start() {
    startTransition(async () => {
      const result = await startProject(playbookId, title);
      if (result?.error) {
        showToast(result.error);
        return;
      }
      showToast(`Started — ${playbookLabel}`);
      router.push(`/projects/p/${result.projectId}`);
    });
  }

  if (!naming) {
    return (
      <button
        type="button"
        onClick={() => setNaming(true)}
        className={`press-sm inline-flex items-center gap-2 rounded-md border-2 border-ink bg-accent font-bold text-accent-ink shadow-[4px_4px_0_0_var(--brutal-shadow)] ${
          size === "lg" ? "px-5 py-3 text-base" : "px-3 py-2 text-sm"
        }`}
      >
        Start this project <ArrowRight size={size === "lg" ? 16 : 14} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border-2 border-ink bg-paper-2 p-3 shadow-[4px_4px_0_0_var(--brutal-shadow)]">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-3">
          What is your project called?
        </span>
        <input
          id={`start-${playbookId}`}
          value={title}
          autoFocus
          placeholder={placeholder}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") start();
            if (e.key === "Escape") setNaming(false);
          }}
          className="w-full rounded-sm border-2 border-ink bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={pending}
          className="press-sm inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-accent px-3 py-2 text-sm font-bold text-accent-ink shadow-[2px_2px_0_0_var(--brutal-shadow)] disabled:opacity-60"
        >
          {pending ? "Starting…" : "Start"} <ArrowRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => setNaming(false)}
          className="press-sm rounded-sm border-2 border-ink bg-paper-3 px-3 py-2 text-sm font-bold text-ink-2"
        >
          Cancel
        </button>
        <span className="text-[11px] text-ink-3">You can rename it later.</span>
      </div>
    </div>
  );
}
