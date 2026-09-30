/**
 * The UpLearn glyph: a "U" with a yellow arrow pointing up inside it. It sits inside the brand tile
 * (accent background, ink border, hard shadow) and inherits the tile's text colour for the U.
 */
export function UpLearnGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3.5v9.5a7 7 0 0 0 14 0V3.5" stroke="currentColor" strokeWidth={3.4} strokeLinecap="square" />
      <path d="M12 6.2 15.6 11.4h-2.2v4.1h-2.8v-4.1H8.4Z" fill="#ffd83d" stroke="currentColor" strokeWidth={1.1} strokeLinejoin="round" />
    </svg>
  );
}
