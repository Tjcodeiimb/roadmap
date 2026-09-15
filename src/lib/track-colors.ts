// Per-track/domain color lookup. Colors live as CSS custom properties in
// globals.css (--track-{id}, --track-{id}-ink) so they stay theme-aware
// automatically — this just builds the var() reference string for a given
// track id or skill domain string, with a safe fallback to the shared
// --accent for anything not in the set (e.g. cohorts, which span tracks).
export function trackColor(id: string | null | undefined): string {
  if (!id) return "var(--accent)";
  return `var(--track-${id}, var(--accent))`;
}

export function trackInk(id: string | null | undefined): string {
  if (!id) return "var(--accent-ink)";
  return `var(--track-${id}-ink, var(--accent-ink))`;
}
