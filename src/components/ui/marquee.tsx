import { Fragment } from "react";

/**
 * A ticker band. The content is rendered twice and the track scrolls exactly
 * 50%, which is what makes the loop seamless — at the moment the first copy
 * leaves the frame the second is in precisely its starting position.
 *
 * Pure CSS (see `.marquee-track` in globals.css), so it costs no JS and no
 * per-frame React work. It pauses on hover and focus, and stops entirely
 * under prefers-reduced-motion — a band of moving text is a vestibular
 * trigger, and it's decoration, so it collapses to static rather than
 * merely slowing down.
 */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;

  return (
    <div
      className={`marquee overflow-hidden border-y-2 border-ink bg-ink ${className}`}
      // Decorative duplication would otherwise be read out twice.
      aria-hidden="true"
    >
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <Fragment key={copy}>
            {items.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex shrink-0 items-center gap-3 px-5 py-2 font-display text-xs font-extrabold uppercase tracking-[0.12em] text-paper"
              >
                {item}
                <span className="text-accent">◆</span>
              </span>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
