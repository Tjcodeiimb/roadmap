# Discovery

Order: read the codebase → present a brief for approval → ask what is left → offer directions →
write the treatment. Never start with a questionnaire.

## The brief you present (after reading the code)

Keep it to one screen. Tag each line **found** (say where) or **guessed**.

```
Product      <name as written in the app>                        found: app/layout.tsx title
Does         <one sentence>                                      found: README
For          <who>                                               guessed from seed data
Pain         <the problem it removes>                            guessed
Show         1. <feature> — why it is worth showing              found: routes + recent commits
             2. ...
Brand        colours <hex…>, font <name>, logo <file or "typeset name">   found: tokens.css
Demo data    <real / fictional>, locale <…>                      found: seed file
Not sure     <anything you could not work out>
```

Then ask: "Is this right? Edit anything that's off, or approve it."

If there is no codebase, ask for the same items directly, plus screenshots.

## Question bank (ask only what the code did not answer)

Prefer multiple choice with a recommended option first. Two or three rounds of up to four questions.

**Purpose**
- Where will this be posted? (website hero / social feed / investor deck / app store / event screen)
- What is the one thing a viewer should remember?
- Who is watching, and how much do they already know?

**Format**
- Aspect ratio: 16:9, 9:16, 1:1, or more than one?
- Length: about 20, 30 or 45 seconds?
- Will it play with sound on, or usually muted? (decides how much the text must carry)

**Visual style**
- Mood: calm and precise / bold and loud / playful / premium and minimal / technical
- Light or dark? Flat or with depth (3D tilt, shadows, parallax)?
- How much real UI versus abstract graphics and type?
- Any videos or brands whose look you like? Any you want to avoid?

**Brand**
- Follow the brand exactly, or may I extend it (extra accent colour, display type)?
- Is there a logo file? May it animate? (Never redraw or alter a logo without a yes.)

**Story shape** (offer these, and "something else")
- problem → solution
- a day in the life of one user
- feature showcase, one after another
- one continuous shot through the product
- before / after
- a data story (numbers that change)
- text-led manifesto, UI as supporting picture

**Transitions and pacing**
- Hard cuts on the beat / matched morphs between scenes / camera moves through one space / wipes and masks
- Fast and dense, or slow with room to read?
- Cursor-driven (someone using the app) or no cursor?

**Text**
- How much on-screen copy: a headline per scene / a few words / almost none?
- Tone: plain / witty / confident / warm. Will you write the lines or should I draft them?

**Sound**
- Genre and energy: electronic / ambient / percussive / orchestral-ish / lo-fi; low, medium or high energy
- Tempo feel: slow (80–95), mid (100–115), fast (120–140)
- Music only, music plus interface sounds, or silent?
- Do you have a track you want to use instead? (Then sync the picture to it.)

**Data and safety**
- Real names and figures, or fictional?
- May I run the app locally for reference? It would connect to: <say what>. (Default: no.)

## Creative directions

After the answers, write 2–3 directions that are different in kind, not variations:

```
A. <title> — story shape, the central visual idea, how scenes connect, palette and type, sound.
B. ...
C. ...
```

None of them may be a re-skin of the Tessel reference (see SKILL.md section 1).

## Treatment (needs approval before any film code)

- Logline (one sentence)
- Beat table: bars or seconds, what is on screen, the line of copy, the sound
- Every on-screen line, verbatim
- Palette, type, corner radius, shadow style
- Transition vocabulary (the 2–3 ways scenes connect in this film)
- Sound plan: tempo, key or mood, instruments, where it goes quiet, where it peaks
- What is fictional
