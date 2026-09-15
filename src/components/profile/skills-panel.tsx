"use client";

import { useState } from "react";
import Link from "next/link";
import { ICONS, FALLBACK_ICON } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { trackColor } from "@/lib/track-colors";
import type { SkillProgress } from "@/lib/queries";

export function SkillsPanel({ skills }: { skills: SkillProgress[] }) {
  const unlocked = skills.filter((s) => s.unlocked);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  async function copyList() {
    const text = unlocked.map((s) => `${s.name} (${s.domain})`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied to clipboard ✓");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Couldn't copy — select and copy manually");
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-ink">
          Skills <span className="text-ink-3">({unlocked.length})</span>
        </div>
        <div className="flex items-center gap-3">
          {unlocked.length > 0 && (
            <button
              onClick={copyList}
              className="text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink"
            >
              {copied ? "Copied ✓" : "Copy for resume"}
            </button>
          )}
          <Link href="/skills" className="text-sm font-bold text-ink-2 underline decoration-2 underline-offset-4 hover:text-ink">
            View all
          </Link>
        </div>
      </div>

      {unlocked.length === 0 ? (
        <p className="text-sm text-ink-2">
          Complete resources to unlock resume-ready skills. See what&apos;s next on the{" "}
          <Link href="/skills" className="underline decoration-2 underline-offset-4 hover:text-ink">
            skills page
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {unlocked.map((s) => {
            const Icon = ICONS[s.iconKey ?? ""] ?? FALLBACK_ICON;
            return (
              <span
                key={s.id}
                className="flex items-center gap-1.5 rounded-sm border-2 border-ink bg-paper-3 px-3 py-1.5 text-xs font-bold text-ink"
              >
                <Icon size={13} style={{ color: trackColor(s.domain) }} /> {s.name}
              </span>
            );
          })}
        </div>
      )}
    </Card>
  );
}
