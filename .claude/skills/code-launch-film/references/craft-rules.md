# Craft rules

These are principles about motion and timing. They do not prescribe a look; apply them to whatever
style the treatment calls for.

## Timing

- Measure everything in bars and beats from `timeline.ts`. Frames per beat = FPS × 60 / BPM.
- Place events by when the eye sees them, not when they start:
  - a spring's "pop" is the first frame past half its travel
  - its "landing" is the first frame it reaches its target
  - a tween visibly lands at about 97% of its travel
  Schedule those frames onto the grid the sound uses.
- A visual hit should peak on the frame of its sound. Use an attack–decay envelope (`hitPulse`:
  short sine attack, exponential decay) rather than a half-sine on a hard window.
- On a hard cut that lands on a beat, the new picture is on screen on the hit frame.

## Motion

- Nothing is ever perfectly still. A hold gets a slow push, drift or parallax.
- No velocity jumps. A move that follows a rest starts from rest; overlap consecutive moves
  instead of stopping and lurching.
- Impacts arrive with speed: the fastest frame is the contact frame, followed by a small
  squash or rebound.
- Things must not overshoot into their neighbours. Clamp a spring at its rest pose and put the
  energy into a punch of the whole group instead.
- Zoom in log space so scale changes feel even.
- Pick each easing on purpose. Define a small named set for the film (arrival, departure, camera,
  drift, UI) and use only those.
- Decide the film's 2–3 transition types in the treatment and stay inside them.

## Seams between acts

- The outgoing act ends on its last in-between; the incoming act's first frame is the rest pose,
  shown once. Both sides use the same transform.
- If two acts share an element, compute it from the absolute frame in one place and render that
  from both acts.

## Discrete versus continuous

- Text, counters, toggles and which-state-is-showing are decided per **whole** frame.
- Continuous motion uses the fractional frame. This matters for motion blur: every sub-sample of a
  frame must agree on discrete state.

## Camera and cursor

- Model the camera as "this world point sits at the viewport centre at this scale", as a list of
  keyframes (`lib/cam.ts`).
- Check every camera pose against the content bounds. A zoom that crops the thing being shown is
  the most common fault.
- A cursor leaves each stop shortly before it is due at the next, eases in, and presses with a
  short down-up envelope. Give it a reason for every click.

## Type and figures

- Size large headlines from measured text width so they sit inside the frame with even margins.
- Centre optically: compensate for side bearings.
- Tabular numbers wherever digits change.
- Rolling numbers move in whole units. No stray decimals mid-roll.
- Figures must be consistent across screens (totals equal their parts).
- Body UI text under about 12 px on a 1080p frame will not read; zoom the camera in for detail.

## Rebuilt UI

- Copy tokens, spacing and copy from the app's own code. Use the same icon set.
- Render a static still of every screen and compare it to the real app before animating.
- If you simplify a flow (skip a dialog, shorten a list), keep it truthful to what the product does.

## Review

- Contact sheet every 0.5 s for the whole film, every 10–20 frames for an act.
- View at least a few frames at full size per act: text legibility, cropped edges, overlaps.
- Write the faults down as a list, fix, render again. Two rounds minimum.
