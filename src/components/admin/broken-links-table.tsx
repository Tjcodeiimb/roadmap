"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { dismissBrokenLink } from "@/app/actions/admin";
import type { BrokenLinkRow } from "@/lib/queries";

export function BrokenLinksTable({ rows }: { rows: BrokenLinkRow[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function dismiss(id: string) {
    startTransition(async () => {
      await dismissBrokenLink(id);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <p className="text-sm text-ink-2">No flagged links right now.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-paper p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{r.title}</div>
            <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-ink-3 hover:text-accent">
              {r.url}
            </a>
            {r.trackLabel && <div className="text-xs text-ink-3">{r.trackLabel}</div>}
          </div>
          <button
            disabled={pending}
            onClick={() => dismiss(r.id)}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-paper-3"
          >
            Mark OK
          </button>
        </div>
      ))}
    </div>
  );
}
