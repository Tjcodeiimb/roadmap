// Copied from the app's light theme (src/app/globals.css). The film never invents a colour
// outside this set.
export const C = {
  paper: '#fffcf5',
  paper2: '#ffffff',
  paper3: '#f5efd9',
  ink: '#0a0a0a',
  ink2: '#3a3a3a',
  ink3: '#6b6b66',
  accent: '#2a2aff',
  accentInk: '#ffffff',
  accentSoft: '#dcdbff',
  success: '#0a6b2b',
  successSoft: '#c6f6d5',
  next: '#ffb200',
  active: '#2a2aff',
  done: '#0a6b2b',
  login: '#ffd83d',
  excel: '#038766', // --track-excel: the "excel" skill domain
};

// Per-track colours for the marketplace feed (--track-* tokens). Excel for Finance has no token of
// its own, so the app falls back to --accent for it, and so does the film.
export const TRACK: Record<string, string> = {
  ai: '#054ee0',
  marketing: '#e00561',
  psychology: '#9705e0',
  sales: '#e01805',
  data: '#03819b',
  consulting: '#b84f04',
  negotiation: '#7a6a00',
  finance: '#038745',
  'excel-finance': C.accent,
  ux: '#d704b3',
  'prompt-eng': '#b86200',
  people: '#6105e0',
};

export const F = {
  display: '"Archivo Variable", "Arial Black", sans-serif',
  mono: '"Space Mono", "Courier New", monospace',
};

/** Hard offset shadow, the app's --brutal-shadow. */
export const shadow = (px: number, color = C.ink) => `${px}px ${px}px 0 0 ${color}`;

/** App UI is authored in CSS px and shown at this zoom so a phone-width layout fills the frame. */
export const UI_ZOOM = 2.4;
