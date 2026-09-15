import clsx from "clsx";

const TIER_LABEL: Record<string, string> = {
  foundational: "Foundational",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TIER_CLASSES: Record<string, string> = {
  foundational: "bg-success-soft text-success border-success",
  intermediate: "bg-accent-soft text-accent border-accent",
  advanced: "bg-ink text-paper border-ink",
};

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-sm border-2 px-2.5 py-1 text-xs font-bold uppercase tracking-wide",
        TIER_CLASSES[tier] ?? TIER_CLASSES.foundational,
        className
      )}
    >
      {TIER_LABEL[tier] ?? tier}
    </span>
  );
}
