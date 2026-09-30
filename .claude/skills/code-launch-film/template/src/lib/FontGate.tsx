// Import the film's fonts here (e.g. an @fontsource-variable package chosen for THIS film).
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

/** Font faces the film uses, as CSS font shorthands, e.g. '600 16px "Inter Variable"'. */
const FACES: string[] = [];

/** Renders nothing until the fonts are decoded: no frame shows a fallback face, and text measurements are exact. */
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender('fonts'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => {
        setReady(true);
        requestAnimationFrame(() => continueRender(handle));
      });
  }, [handle]);
  return ready ? <>{children}</> : null;
};
