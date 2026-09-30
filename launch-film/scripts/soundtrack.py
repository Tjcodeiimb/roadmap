#!/usr/bin/env python3
"""Score for "Tear-off week": 128 BPM, E minor (Em - C - G - D per bar), percussive electronic.

Energy by bar (from the approved beat table):
  1-2   open    tab ticks, then a kick + stamp on "One week."
  3-5   MON     groove enters: kick, claps, off-beat hats, bass
  6-7   TUE     + 16th hats
  8-9   WED     + plucked arp
  10-14 THU     full groove + pad; riser through bar 14; near-silence on 14.4
  15-18 FRI     the drop: sub boom + bells on the unlock, pad stabs
  19-21 SAT     lighter drums, pluck melody
  22    SUN     drums thin out
  23-24 outro   drums gone; Em pad, bells on the tile, one last stamp; tail fade
Every stamp, tap and flip is tuned to the chord under it.
"""
import os

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'synth.py')).read())

import soundfile as sf
import pyloudnorm as pyln

C_ = CUES
# chord per bar: (bass root midi, chord tones)
CHORDS = [
    (40, [52, 55, 59, 64]),  # Em
    (36, [48, 52, 55, 60]),  # C
    (43, [55, 59, 62, 67]),  # G
    (38, [50, 54, 57, 62]),  # D
]


def bar_at(t):
    return int(t // BAR) + 1


def chord_at(t):
    return CHORDS[(bar_at(t) - 1) % 4]


def root_hz(t, octave=0):
    return mtof(chord_at(t)[0] + 12 * octave)


def kick_e(d=0.8, hard=1.0):
    """The synth.py kick, retuned to settle on E1 so it sits under an E-minor bassline."""
    t = tt(d)
    f = mtof(28) + 120 * np.exp(-t / 0.03) + 40 * np.exp(-t / 0.006)
    body = sine(f, d) * np.exp(-t / (0.24 * hard + 0.05))
    click = filt(noise(d), sos_hp(2500)) * np.exp(-t / 0.0025) * 0.4
    return sat(body * 1.15 + click, 1.8) * 0.9


def paper_rip(d=0.32):
    """A page tearing off the pad: fast crackle of band-passed noise bursts, rising in pitch."""
    n = int(d * SR)
    t = np.arange(n) / SR
    x = noise(d)
    grain = (rng.random(n) < 0.02).astype(float)
    grain = filt(grain, sos_lp(900, 1)) * 18
    env = np.minimum(1, t / 0.01) * np.exp(-np.maximum(t - 0.18, 0) / 0.05)
    cut = 1500 + 5000 * (t / d)
    y = sweep_filter(x * (0.4 + grain), cut, 'band') * env * 1.6
    return y


# ---------------------------------------------------------------------------------------
def build_music():
    drums, bass, pad, arp, bells = buf(), buf(), buf(), buf(), buf()
    kicks = []
    hush = fr(C_['cue']['hush'])
    outro = fr(C_['bars']['outro'])

    def silent(t):  # the near-silence beat before Friday
        return hush - 0.01 <= t < hush + BEAT - 0.01

    for n in range(1, 25):
        for beat in range(4):
            t = bar(n, beat)
            if silent(t) or t >= outro:
                continue
            # kick: a single one on "One week." (bar 2), four on the floor bars 3-21, halves in bar 22
            if (n == 2 and beat == 0) or (3 <= n <= 21) or (n == 22 and beat in (0, 2)):
                g = 1.0 if n != 22 else 0.8
                place(drums, kick_e(hard=1.1 if n >= 15 and n <= 18 else 1.0), t, 0.95 * g)
                kicks.append((t, g))
            if 3 <= n <= 21 and beat in (1, 3):
                place(drums, clap(), t, 0.42, 0.05)
            if 3 <= n <= 21:
                place(drums, hat(0.08, 0.02), t + BEAT / 2, 0.30, 0.25)
            if (6 <= n <= 18) and not (n == 14 and beat == 3):
                for s in (1, 3):
                    place(drums, hat(0.05, 0.010, 9000), t + s * BEAT / 4, 0.14, -0.3 + 0.15 * s)
            # bass: 8ths on the root, octave pop on the and-of-4
            if 3 <= n <= 21:
                r = chord_at(t)[0]
                for e in range(2):
                    m = r + (12 if (beat == 3 and e == 1) else 0)
                    place(bass, bass_note(m - 12, BEAT / 2 * 0.9), t + e * BEAT / 2, 0.55)
    # bar 22: one long root under the week strip gliding into place
    place(bass, bass_note(40 - 12, BAR * 0.95), bar(22), 0.5)

    # pads: bars 10-22 sustained chords, louder in the drop; outro Em held
    for n in range(10, 23):
        t = bar(n)
        tones = chord_at(t)[1]
        lvl = 0.10 if n < 15 else 0.16 if n <= 18 else 0.09
        for m in tones[:3]:
            place(pad, supersaw_note(m, BAR * 1.02, cutoff=2200 if n >= 15 else 1400, a=0.02 if n >= 15 else 0.15, r=0.2), t, lvl)
    for m in [40, 52, 55, 59, 64]:
        place(pad, supersaw_note(m, 3.6, cutoff=1600, a=0.05, r=2.2), outro, 0.13)
    # opening: a dark Em drone under the empty week, so the bar after "One week." isn't dead air
    for m in [40, 52, 59]:
        place(pad, supersaw_note(m, bar(3) + 0.1, cutoff=700, a=1.2, r=0.3), 0, 0.09)

    # plucked arp: 16ths up the chord, bars 8-18 (thins in the hush)
    for n in range(8, 19):
        for s in range(16):
            t = bar(n) + s * BEAT / 4
            if silent(t):
                continue
            tones = chord_at(t)[1]
            m = tones[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12
            place(arp, pluck(m, 0.3), t, 0.10 if s % 4 else 0.14, 0.35 if s % 2 else -0.35)
    # Saturday: a small pluck melody in E minor pentatonic
    mel = [(0, 71), (0.75, 67), (1.5, 64), (2, 66), (3, 67), (4, 71), (4.75, 74), (5.5, 71), (6, 69), (7, 67), (8, 64), (8.75, 67), (9.5, 71), (10, 76)]
    for bt, m in mel:
        place(arp, pluck(m, 0.5, tau_a=0.3), bar(19) + bt * BEAT, 0.16, 0.1)

    # bells on the big moments
    lu = fr(C_['levelUp'])
    for m, dt in [(67, 0), (74, 0.08)]:
        place(bells, fm_bell(m, 2.0, tau=0.6), lu + dt, 0.10, 0.2)
    un = fr(C_['unlock'])
    for m, dt in [(76, 0), (83, 0.06), (88, 0.12)]:
        place(bells, fm_bell(m, 3.0, tau=0.9), un + dt, 0.12, 0)
    tile = fr(C_['endTile'])
    for m, dt in [(64, 0), (71, 0.05), (76, 0.1), (79, 0.15)]:
        place(bells, fm_bell(m, 4.0, tau=1.4), tile + dt, 0.11, 0)

    return dict(drums=drums, bass=bass, pad=pad, arp=arp, bells=bells, kicks=kicks)


# ---------------------------------------------------------------------------------------
def build_sfx():
    fx, fx_end = buf(), buf()
    outro = fr(C_['bars']['outro'])

    # tabs dropping onto the strip: a rising wooden ladder in E minor pentatonic
    ladder = [64, 67, 69, 71, 74, 76, 79]
    for i, (f, pan, w) in enumerate(C_['tabs']):
        place(fx, tock(mtof(ladder[i]) * 2, 0.12, 0.025, 0.3), fr(f), 0.35 * w, pan)

    # headline stamps: a heavy snap tuned to the chord root, plus a thump
    for f, pan, w in C_['labels']:
        t = fr(f)
        dst = fx_end if t >= outro else fx
        place(dst, snap(0.6, weight=1.0, root=root_hz(t, -1) * 2), t, 0.55 * w, pan)
        place(dst, sub_boom(0.5, 70, 45, 0.08) * 0.5, t, 0.30 * w)
    for f, pan, w in C_['smallStamps']:
        t = fr(f)
        dst = fx_end if t >= outro else fx
        place(dst, snap(0.4, weight=0.5, root=root_hz(t) * 2), t, 0.35 * w, pan)

    # each new day: the tab slams in with a tock at the day's pitch
    for i, (f, pan, w) in enumerate(C_['days']):
        t = fr(f)
        place(fx, tock(mtof([64, 66, 67, 69, 71, 74, 76][i]) * 2, 0.15, 0.03, 0.5), t, 0.35, pan)

    # tears: the rip itself, then a whoosh peaking on the page's fastest frame
    for f, pan, w in C_['tears']:
        t = fr(f)
        place(fx, paper_rip(), t - 0.22, 0.45 * w, pan)
        wd = 0.45
        place(fx, whoosh(wd, 300, 2400, 500, peak=0.75, width=0.8), t - wd * 0.75, 0.20 * w)

    # taps and presses
    for f, pan, w in C_['taps']:
        place(fx, ui_click(), fr(f), 0.40 * w, pan)

    # status flips: a blip tuned to the chord; completions get a second, higher blip
    for i, (f, pan, w) in enumerate(C_['flips']):
        t = fr(f)
        tones = chord_at(t)[1]
        m = tones[i % 3] + 12
        place(fx, blip(mtof(m), True), t, 0.22, pan)
        if w >= 1:
            place(fx, blip(mtof(m + 7), True), t + 0.06, 0.18, pan)

    # the feed scroll and the strip glide: long soft whooshes on the velocity peak
    for s in C_['scrolls']:
        d = max(0.5, fr(s['to'] - s['from']))
        pk = (fr(s['peak']) - fr(s['from'])) / d
        place(fx, whoosh(d, 200, 1600, 300, peak=max(0.1, min(0.9, pk)), width=0.5), fr(s['from']), 0.22 * s['gain'])

    # toast: two quick blips
    place(fx, blip(mtof(76), True), fr(C_['toast']), 0.2, 0)
    place(fx, blip(mtof(83), True), fr(C_['toast']) + 0.07, 0.16, 0)

    # XP counter ticks: a tight pitch ladder
    for i, f in enumerate(C_['xpTicks']):
        place(fx, tick(2400 + 90 * (i % 12), 0.04, 0.005, 0.5), fr(f), 0.13, 0.15)

    # the riser into Friday, then the unlock hit
    un = fr(C_['unlock'])
    drop = fr(C_['cue']['drop'])
    place(fx, riser(bar(15) - bar(13, 2) - BEAT, 300, 6000, True, 52), bar(13, 2), 0.20)
    place(fx, riser(bar(3) - bar(2, 1), 250, 4000, True, 52), bar(2, 1), 0.14)
    place(fx, sub_boom(2.2, 55, 38, 0.3), drop, 0.55)
    place(fx, sub_boom(2.0, 62, 41, 0.25), un, 0.45)
    place(fx, snap(0.7, 1.2, mtof(40)), un, 0.5)
    for k in range(8):
        place(fx, tick(3000 + 250 * k, 0.03, 0.004, 0.4), un + 0.15 + 0.03 * k, 0.06, -0.7 + 0.2 * k)

    # the cut to the skills page and Saturday's chip landing
    place(fx, ui_click(), fr(C_['skillsCut']), 0.25)
    place(fx, whoosh(0.3, 800, 3000, 600, peak=0.8), fr(C_['satLand']) - 0.24, 0.18)
    place(fx, snap(0.5, 0.8, root_hz(fr(C_['satLand']))), fr(C_['satLand']), 0.45, -0.3)
    place(fx, blip(mtof(83), True), fr(C_['satFlat']), 0.2)

    # end card: tile stamp (big, low), name thump
    tile = fr(C_['endTile'])
    place(fx_end, snap(0.8, 1.3, mtof(28) * 2), tile, 0.6)
    place(fx_end, sub_boom(2.5, 55, 41, 0.35), tile, 0.45)
    place(fx_end, tock(mtof(64) * 2, 0.2, 0.04, 0.6), fr(C_['endName']), 0.35)
    return fx, fx_end


# ---------------------------------------------------------------------------------------
def main():
    m = build_music()
    fx, fx_end = build_sfx()
    sc = sidechain(m['kicks'], depth=0.5, tau=0.12)
    music = m['drums'] + m['bass'] * sc + m['pad'] * sc + m['arp'] * (0.5 + 0.5 * sc) + m['bells']

    # reverb send, high-passed so the low end stays tight
    send = filt(m['pad'] * 0.5 + m['arp'] * 0.6 + m['bells'] * 0.8 + m['drums'] * 0.08, sos_hp(250))
    music = music + reverb(send, IR_HALL) * 0.28

    # music-bus automation: tuck under the UI in the busy acts, duck hard into the hush, open for the drop
    hush = fr(C_['cue']['hush'])
    drop = fr(C_['cue']['drop'])
    outro = fr(C_['bars']['outro'])
    bus = envelope([
        # the week builds: Mon 0.55 -> Thu 0.8, the drop at 1.0, Saturday eases back
        (0, 0.9), (bar(3) - 0.05, 0.9), (bar(3), 0.55), (bar(6), 0.62), (bar(8), 0.7), (bar(10), 0.8),
        (hush - 0.08, 0.8), (hush + 0.04, 0.06), (drop - 0.03, 0.06), (drop, 1.0),
        (bar(19) - 0.05, 1.0), (bar(19), 0.72), (outro, 0.72), (DUR, 0.72),
    ])
    fxbus = envelope([(0, 1.0), (hush - 0.08, 1.0), (hush + 0.04, 0.15), (drop - 0.03, 0.15), (drop, 1.0), (DUR, 1.0)])
    mix = music * bus + (fx + reverb(filt(fx, sos_hp(400)), IR_ROOM) * 0.18) * fxbus

    # mono below 120 Hz, gentle glue, light saturation
    low = filt(mix, sos_lp(120, 2))
    mix = mix - low + low.mean(axis=1, keepdims=True)
    mix = sat(mix * 0.9, 1.1)

    # tail: fade over the end hold, then add what must survive the fade
    total = C_['total'] / FPS
    t = np.arange(N) / SR
    fade = np.clip((total - t) / (total - fr(C_['endName']) - 0.5), 0, 1) ** 1.5
    fade = np.where(t < fr(C_['endName']) + 0.5, 1.0, fade)
    mix = mix * fade[:, None] + fx_end * np.clip((total - t) / 1.2, 0, 1)[:, None]
    mix = mix[: int(total * SR)]

    meter = pyln.Meter(SR)
    for _ in range(3):
        loud = meter.integrated_loudness(mix)
        mix = mix * 10 ** ((-14.0 - loud) / 20)
        mix = limiter(mix, ceiling=0.77)
    print(f'integrated {meter.integrated_loudness(mix):.2f} LUFS, peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS, {len(mix) / SR:.3f} s')

    out = os.path.join(ROOT, 'public', 'audio')
    os.makedirs(out, exist_ok=True)
    sf.write(os.path.join(out, 'soundtrack.wav'), mix, SR, subtype='PCM_24')

    # RMS per quarter second, to compare with the beat table without ears
    q = int(0.25 * SR)
    rms = [20 * np.log10(np.sqrt(np.mean(mix[i:i + q] ** 2)) + 1e-9) for i in range(0, len(mix), q)]
    print('rms/0.25s:', ' '.join(f'{r:.0f}' for r in rms))


if __name__ == '__main__':
    main()
