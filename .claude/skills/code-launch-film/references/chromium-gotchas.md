# Chromium rendering gotchas

Remotion renders in headless Chromium. These faults show up in stills and contact sheets.

| What you see | Why | What to do |
|---|---|---|
| A blur that ramps in visible steps | Animated `filter: blur()` radius is quantized | Render the layer twice, sharp and at a fixed blur, and cross-fade them. Overscan both so the blur never pulls in transparent edge pixels. |
| Slow drifts move in 1 px steps | Fractional `left`/`top` combined with a non-translate transform snaps the layer to whole pixels | Put all positioning in one `transform: translate(...) scale(...)` |
| Soft gradients show contour rings; light greys tint | CSS gradients and layer blending are 8-bit | Bake subtle glows as dithered PNGs (compute in float, add ±1 LSB triangular noise, quantize once) |
| Text goes soft under 3D perspective | Large layers under perspective raster at a capped scale | Lay the layer out at shot scale with CSS `zoom`, and scale the camera by the inverse |
| A stale frame of an element flashes | Layer with animated blur was promoted to the compositor (`will-change`, 3D transform) | Do not promote layers that have animated filters |
| Console errors and frozen corners on some frames | A spring rebound pushed a value past its range, giving a negative SVG radius or alpha | Clamp values derived from springs before they reach SVG attributes |
| Fallback font on the first frames; wrong text widths | Fonts not decoded yet | Wrap every composition in `FontGate`; measure text only inside it |
| Text measured with canvas is slightly off | Variable-font weight and letter-spacing | Measure with a hidden DOM span (`lib/measure.ts`) |
| Motion blur made in-browser looks dark and banded | Each blended sample is quantized to 8 bits | Average sub-frames outside the browser (`accumulate.py`) |
| Blurred frame shows two text states at once | Discrete state changed between sub-samples | Decide text and toggles per whole frame |
| Audio is 2–3 frames late in the MP4 | Remotion's AAC mux keeps encoder priming | Render the picture muted and mux with ffmpeg; verify with `check-sync.py` |

## Motion blur pipeline

1. Render a sharp cut.
2. `measure-speed.py` runs optical flow on it and decides how many sub-frames each frame needs
   (one for still frames, up to 48 on the fastest moves, 240° shutter).
3. The `LaunchSub` composition renders the film as that stream of sub-frames.
4. `accumulate.py` averages each frame's sub-frames in floating point, dithers and encodes.

`src/blur.ts` keeps sub-frame times inside their own act, so a blur never mixes two scenes.
`accumulate.py` assumes 1920×1080 at 60 fps; change `W`, `H` and `-r` there for other formats.
