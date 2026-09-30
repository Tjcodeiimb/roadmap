import '@fontsource-variable/archivo';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import { useEffect, useState } from 'react';
import { continueRender, delayRender } from 'remotion';

const FACES: string[] = [
  '400 16px "Archivo Variable"',
  '600 16px "Archivo Variable"',
  '800 16px "Archivo Variable"',
  '900 16px "Archivo Variable"',
  '400 16px "Space Mono"',
  '700 16px "Space Mono"',
];

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
