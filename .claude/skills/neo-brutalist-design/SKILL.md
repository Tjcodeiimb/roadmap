---
name: neo-brutalist-design
description: Apply or maintain the UpForge Learning app's bold, neo-brutalist visual redesign. Use when asked to redesign, restyle, or make the website "bold"/"neo-brutalist"/"brutalist", or when adding any new UI to the app after that redesign has landed (so new components stay consistent with it).
---

# Neo-brutalist redesign for UpForge Learning

This app currently uses a soft, minimal design system: rounded corners
(`rounded-2xl`/`rounded-xl`/`rounded-full`), soft ambient shadows
(`.card-shadow` in `src/app/globals.css`), muted colors, and gentle
easeOut transitions. The user wants a **bold, neo-brutalist** identity
instead. This skill defines what that means concretely in this codebase
and how to apply it without breaking the token architecture everything
already relies on.

## Neo-brutalist principles to apply

- **Hard, offset shadows instead of soft/blurred ones** — e.g. `4px 4px 0
  var(--ink)` (no blur radius), not the current multi-layer soft
  `box-shadow` in `.card-shadow`.
- **Thick, visible borders** — `2px`-`3px` solid, always full opacity
  (`border-ink`, not the current faint `border-border`), not thin
  1px hairlines.
- **Sharp or minimally-rounded corners** — `rounded-none` or a small
  fixed radius (e.g. 4px) everywhere, replacing `rounded-2xl`/`rounded-xl`/
  `rounded-full` pill shapes.
- **Flat, high-contrast, saturated colors** — no soft pastel `-soft`
  backgrounds (`accent-soft`, `success-soft`, etc.) fading into the
  paper background; badges/status pills should read as solid blocks of
  color with a border, not a tinted wash.
- **Bold, blocky typography** — heavier weights, larger sizes, tighter
  or negative letter-spacing on headings; the existing `font-display`
  (Inter, weights 400-800 already loaded in `src/app/layout.tsx`) can
  stay, just lean on 700/800 more and size up headings.
- **Visible structure over ambient elegance** — thick dividers between
  sections instead of relying on whitespace/soft shadow to imply
  separation; interactive elements should have obvious, blocky
  pressed/hover states (e.g. shifting the hard shadow on press, like a
  button "sinking" into the page) rather than a subtle opacity fade.
- **No gradients, no blur, no glassmorphism.** Every surface is a flat
  fill with a hard border.
- **The signature "press" interaction**: instead of a soft opacity/color
  fade on hover, an interactive element (button, card, link-styled-as-
  button) sits at a base offset from its hard shadow, then on hover/active
  the element translates toward the shadow (e.g. `translate(2px, 2px)`)
  while the shadow itself shrinks by the same amount — reading as the
  element physically pressing down into the page. Keep it cheap
  (`transform`/`box-shadow` only, short duration, no easing curve that
  implies softness) so it stays "snappy and mechanical," not smooth.
- **Don't soften it later.** The harshness (hard edges, flat shadows, no
  blur) is the identity, not a rough draft to polish — resist rounding
  corners back off or adding blur "for accessibility/elegance" reasons
  once it's in; that just turns it back into generic SaaS design.

## Where to make the change (token-first, not component-by-component)

Every component in this codebase already reads color from CSS custom
properties defined once in `src/app/globals.css` (`:root`, the dark-mode
block, and `:root[data-theme="dark"]`) — never a hardcoded hex in a
component. **Change the redesign at the token layer first**, then adjust
the handful of shared primitives, rather than editing every component
that consumes them:

1. `src/app/globals.css` — the `:root` block (and its dark-mode
   duplicate) is where `--paper`, `--ink`, `--accent`, `--border`,
   `--radius-lg/md/sm`, and the `--shadow-color` used by `.card-shadow`
   all live. Consider adding new tokens here rather than overloading
   existing ones if a hard-shadow color needs to differ from `--ink`
   (e.g. `--brutal-shadow: var(--ink)`).
2. `.card-shadow` (same file, ~line 128) — replace its soft multi-layer
   `box-shadow` with a hard offset shadow. This one change updates every
   `Card` and most modals/dropdowns at once.
3. `src/components/ui/card.tsx`, `button.tsx`, `badge.tsx` — the three
   shared primitives nearly everything else composes. Update their
   Tailwind classes (border width/color, radius, shadow) here and it
   propagates everywhere they're used, rather than hunting down every
   call site.
4. `src/lib/motion.ts` — the shared `DUR`/`EASE`/`listReveal()` motion
   tokens. Neo-brutalist interactions tend to be snappier/more mechanical
   (shorter duration, no ease-out "settle") — consider a firmer easing
   curve or near-instant transitions for hover/press states specifically,
   while keeping longer content-reveal animations as-is unless asked to
   change those too.
5. Icons (`src/components/icons/`) — the custom stroke-based SVG marks
   use `strokeWidth` from `icon-base.tsx`. A bolder identity may want a
   heavier default stroke width there.

## Constraints to respect while doing this

- **Keep the token indirection.** Never hardcode a color in a component
  that could instead read from a CSS variable — that's what keeps light/
  dark mode in sync and lets the whole redesign be tunable from one file.
- **Update both the light (`:root`) and dark (`prefers-color-scheme` +
  `:root[data-theme="dark"]`) blocks together** — three near-duplicate
  blocks currently exist in `globals.css`; a change to one without the
  other two silently breaks whichever theme was missed.
- **Preserve `prefers-reduced-motion` support** (`globals.css` ~line 132
  and `MotionConfig reducedMotion="user"` in `app-shell.tsx`) — a bolder
  motion language still needs to collapse to near-static for users who
  asked for it.
- **Don't reintroduce emoji or ad-hoc inline styles** — the icon system
  (`src/components/icons`) and Tailwind utility classes are the existing
  conventions; extend them, don't bypass them.
- Run `npx tsc --noEmit`, `npx eslint .`, and `npm run build` after any
  redesign pass, same as any other change to this repo.

## Suggested order of work for a full redesign pass

1. Redefine tokens in `globals.css` (colors, radius, shadow) for both
   themes.
2. Update `Card`, `Button`, `Badge`, `StatusBadge` in `src/components/ui/`.
3. Spot-check the highest-traffic pages first: dashboard, marketplace
   (course/cohort cards), track/topic pages, sidebar nav.
4. Sweep remaining one-off `rounded-*`/`shadow-*`/soft-color classes
   across `src/components/**` for anything the shared primitives didn't
   already cover.
5. Verify both light and dark mode, and a reduced-motion pass, before
   calling it done.
