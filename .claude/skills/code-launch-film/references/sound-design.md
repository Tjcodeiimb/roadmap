# Sound

The soundtrack is synthesized by `scripts/soundtrack.py` from `out/cues.json`. `scripts/synth.py`
is a library of instruments and mixing tools with no score in it. Write a new score for every film:
tempo, key, instruments and structure come from the approved treatment, not from the reference.

You cannot hear the result. Check it numerically (below) and ask the user to listen.

## 1. Export the cues

Write `scripts/export-cues.ts` for the film. It imports timing constants from the acts themselves
and writes JSON:

```ts
const cues = { fps, total, bpm, acts: ACT, cue: CUE, /* per-act lists of frames */ };
writeFileSync('out/cues.json', JSON.stringify(cues, null, 1));
```

Rules:
- Export constants from the act files and import them here. Never retype a frame number.
- A whoosh belongs on the **velocity peak** of its move: sample the easing and take the frame of
  the largest step.
- An impact belongs on the frame a spring first reaches its target: simulate the spring.
- Include a pan value (−1…1) for events that happen left or right of centre.

## 2. Structure of soundtrack.py

```python
import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'synth.py')).read())

def build_music():   # returns dict(drums, bass, pad, arp, bells, kicks=[(time, gain), ...])
def build_sfx():     # returns (fx, fx_end)  — fx_end is anything that must survive the final fade
def main():          # mix, master, write public/audio/soundtrack.wav
```

Helpers from `synth.py`:

- time: `fr(frame)`, `bar(n, beat)`, `mtof(midi)`, `place(buffer, sound, seconds, gain, pan)`
- drums and hits: `kick`, `clap`, `hat`, `tick`, `tock`, `snap`, `sub_boom`
- tonal: `supersaw_note`, `pluck`, `bass_note`, `fm_bell`, `blip`, `sine`, `saw_blep`
- texture: `whoosh`, `riser`, `reverse_suck`, `noise`, `key_click`, `ui_click`
- space and dynamics: `reverb(x, IR_HALL | IR_ROOM)`, `pingpong`, `sidechain`, `limiter`, `envelope`, `sat`, `filt` with `sos_lp/hp/bp`

Build new sounds from these when the film needs its own character.

## 3. Score design

- Decide a chord per bar and an energy curve that follows the picture: where it is quiet, where it
  drops, where it peaks. Write it as a table first.
- Leave room: when interface sounds are busy, thin the music (fewer hats, lower bus level).
- A short near-silence before a big moment makes it land. Duck everything, reverb tails included.
- Tune effects to the current chord so they sound ordered rather than random.
- Give repeated events variation: pitch ladders, small random detune, panning by screen position.
- If the film has a recurring visual motif, it may have a recurring sound, but only if the
  treatment calls for one.
- If the user supplies their own track, skip the score: detect its tempo and downbeats, set
  `timeline.ts` to match, and generate only the effects.

## 4. Mix chain (in main)

1. Sum stems; sidechain bass and pads to the kick.
2. Reverb sends high-passed at 250 Hz so the low end stays tight.
3. Music-bus automation with `envelope([(time, gain), ...])`.
4. Mono below 120 Hz; gentle bus compression; light saturation.
5. Fade the tail over the end hold; add `fx_end` after the fade.
6. Normalize to **−14 LUFS** integrated with `pyloudnorm`, then `limiter(mix, ceiling=0.77)` so the
   true peak stays under **−1 dBTP** after AAC encoding. Repeat 2–3 times.
7. Write 24-bit 48 kHz stereo to `public/audio/soundtrack.wav`.

## 5. Checks you can do without ears

- `check-sync.py` after the mux: lag must be 0 samples, true peak at or below −1 dBTP.
- Print RMS per 0.25 s and compare with the beat table: quiet where the picture is quiet, peaks on
  the hits, silence before drops.
- Confirm the file length equals `total / fps`.

Then tell the user the audio is unverified by ear and ask them to listen for anything harsh,
too loud, or out of place.
