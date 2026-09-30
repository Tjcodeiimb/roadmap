---
name: code-launch-film
description: Make a 20–45 second product launch video entirely in code on a Windows laptop — picture with Remotion (React rendered to frames), soundtrack synthesized in Python, locked to the same timeline. Use when the user asks for a launch video, product film, promo or demo video for their app, an animated product video, or a Remotion video. Covers discovery (reading the codebase, then asking about style), treatment, Windows setup, build, sound, review and render.
---

# Code launch film

You are making a short launch film for the user's product, built in code: Remotion renders React
components to frames, a Python script synthesizes the music and sound effects, and both read one
timeline so sound and picture stay frame-accurate. No stock footage, no templates.

This skill gives you the **technique**. The **design** of every film is new.

## 1. The first rule: technique is shared, design is not

The method comes from one open-source reference, the "Tessel" launch film
(`github.com/Leonxlnx/claude-launchvideo`). Study it for how things are engineered. Do not
reproduce how it looks or moves. By default you must NOT reuse any of these Tessel choices:

- a single accent object (its red dot) that stays on screen and is handed from scene to scene
- the logo pieces opening up to become the app window
- its act order (problem headline → logo → prompt → "magic" → three features → pull-back → lockup)
- an oversized headline slamming in, then everything imploding into a point
- the black-and-white palette with exactly one red accent
- word-by-word rise-and-unblur text reveals
- a tabletop 3D tilt of the UI, a sidebar that widens into a text column, a "quilt" pull-back
- its 120 BPM A♭-major score and clock tick-tock signature
- ending on the same sound or image the film opened with

Any of these is allowed only when the user asks for it or picks it from options you offered. If you
catch yourself reaching for one because it is familiar, stop and design something that fits this
product instead. Two films made with this skill should not look related.

## 2. Discovery: read first, then ask

Do the work before asking. The user should review and correct, not fill in a form.

### 2a. Read the product (no questions yet)

If there is a codebase, repo or site, read it and work out as much as you can:

- README, docs, landing copy, page titles and metadata → what the product is and who it is for
- routes and navigation → the main screens; which ones carry the core value
- design tokens, CSS variables, theme files, font setup → colours, type, radius, shadows
- logo files or how the name is typeset → the mark
- seed or demo data → realistic names, figures and locale
- recent commits and the roadmap → what is new and worth showing
- existing screenshots in the repo

Do not run the app against a live database or log in to anything unless the user asks you to.
Reading code is enough to rebuild screens.

### 2b. Show what you worked out, for approval

Present a short brief the user can approve or edit. Mark every line as **found** (with where) or
**guessed**:

- what it does, in one sentence
- who it is for
- the pain it removes
- the 2–4 features most worth showing, and why those
- brand: name as written, colours, font, logo
- demo data you plan to use (say if it is fictional)

Ask: "Is this right? Change anything that's off." Wait for the answer.

### 2c. Ask only what the code cannot tell you

Use multiple-choice questions where you can (see `references/discovery-questions.md` for the full
bank). At minimum settle:

- purpose and where it will be posted; the one thing a viewer should remember
- format (16:9, 9:16, 1:1) and length
- mood and visual style; films they like or dislike
- how strictly to follow the brand; never alter a logo without asking
- story shape, transition style and pacing
- how much on-screen text, and its tone
- sound: genre, tempo, energy; interface sounds or not; their own track or a synthesized one

### 2d. Offer directions, then write a treatment

Propose **2–3 creative directions that differ from each other** (different story shape, visual
idea and sound). One short paragraph each. The user picks or mixes.

Then write a one-page treatment: logline, beat table with timings, every line of on-screen copy,
palette, type, transition vocabulary, sound plan. **Do not write film code until the user approves
the treatment.**

## 3. Windows setup

Read `references/windows-setup.md` before creating the project. The short version:

1. Work in a **short path** (for example `C:\Projects\film`). Long paths break the Chromium
   download and Python packages.
2. Copy `template/` from this skill into the project, then `npm install`.
3. Create a Python virtualenv next to it and install
   `numpy scipy soundfile pyloudnorm opencv-python-headless pillow imageio-ffmpeg`.
4. Copy this skill's `scripts/` into the project's `scripts/`.
5. Pre-flight: render one still with `npx remotion still` and confirm it opens, before writing acts.

## 4. Architecture every film shares

- `src/timeline.ts` is the single source of truth: FPS, BPM, acts and cues in bars and beats.
  Pick the tempo for this film; do not default to the reference's.
- Each act is one component in its own `<Sequence>`, and also its own preview composition.
- Rebuild the product's screens as real React components driven by data, styled from the app's
  own tokens. Lay out in native pixels with explicit coordinates for anything a camera or cursor
  targets. Never use screenshots as the picture.
- `lib/FontGate.tsx` blocks rendering until fonts load; `lib/measure.ts` measures real text.
- `lib/anim.ts`: tweens, springs, an attack–decay hit envelope, seeded random. Replace its easing
  set with curves chosen for this film's feel.
- `lib/cam.ts`: camera poses and cursor paths as keyframe lists.
- `scripts/export-cues.ts` (you write this per film) imports the acts' own timing constants and
  writes `out/cues.json`. The soundtrack reads only that file.

## 5. Build order

1. Tokens and one static "lab" composition per rebuilt screen. Render stills and compare them with
   the real app before animating anything.
2. Timeline and empty acts.
3. One act at a time. Review each with a contact sheet (`scripts/sheet.py`) and full-size stills.
4. Assemble, then export cues and write the score (`references/sound-design.md`).
5. `node scripts/render.mjs out/film.mp4` for a sharp cut; add `--blur` for the final master.

## 6. Craft and review

Follow `references/craft-rules.md` (principles, not a look) and check
`references/chromium-gotchas.md` whenever something renders wrong.

Do at least two written critique rounds on the assembled film. For each, list concrete faults and
fix them: story logic, legibility at 1080p, framing that crops content, holds that go dead,
velocity jumps, seams, figures that do not add up, sound that does not match the picture.

## 7. Delivery

Give the user the file path and say plainly:

- what is fictional (names, figures)
- anything you changed or extended from their brand
- anything unverified: you cannot hear audio, so ask them to listen; say if you never ran the app
- how to re-render after edits

## Files in this skill

- `references/discovery-questions.md` — question bank and the brief format
- `references/craft-rules.md` — motion, camera, type and timing principles
- `references/windows-setup.md` — setup steps and every known Windows problem
- `references/chromium-gotchas.md` — rendering bugs and workarounds
- `references/sound-design.md` — how to write the score and effects, and the mix chain
- `scripts/` — `render.mjs`, `sheet.py`, `check-sync.py`, `measure-speed.py`, `accumulate.py`, `synth.py`
- `template/` — empty starter project (no acts, no brand, no score)
