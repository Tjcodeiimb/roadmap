#!/usr/bin/env python3
"""Score for "Close the tabs": 128 BPM, F# minor (F#m - D - A - E per bar), syncopated two-step groove.

  1-3   the problem: no groove; ticking clutter, detuned clashing plucks, a pressure riser
  4     every window snaps shut: the drop, clean chord, groove lands
  5-7   cohorts: groove; pops as courses line up
  8-10  roadmap: + arp; unlock bells
  11-14 resume builder: groove thins under the clicks
  15-16 end card: drums out, pad + bells, tail
"""
import os

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'synth.py')).read())

import soundfile as sf
import pyloudnorm as pyln

C_ = CUES
CHORDS = [(42, [54, 57, 61, 66]), (38, [50, 54, 57, 62]), (45, [57, 61, 64, 69]), (40, [52, 56, 59, 64])]


def chord_at(t):
    return CHORDS[(int(t // BAR)) % 4]


def kick_fs(d=0.8):
    t = tt(d)
    f = mtof(30) + 120 * np.exp(-t / 0.03) + 40 * np.exp(-t / 0.006)
    body = sine(f, d) * np.exp(-t / 0.28)
    click = filt(noise(d), sos_hp(2500)) * np.exp(-t / 0.0025) * 0.4
    return sat(body * 1.15 + click, 1.8) * 0.9


def build_music():
    drums, bass, pad, arp, bells = buf(), buf(), buf(), buf(), buf()
    kicks = []
    r = np.random.default_rng(11)
    for s in range(3 * 16):
        if r.random() < 0.25 + 0.5 * s / 48:
            t = s * BEAT / 4 + r.random() * 0.03
            m = int(r.choice([54, 55, 60, 61, 66, 67])) + 12
            place(arp, pluck(m + r.normal(0, 0.25), 0.25), t, 0.10, r.uniform(-0.8, 0.8))
    for n in range(1, 4):
        place(drums, tick(1800, 0.05, 0.01, 0.6), bar(n), 0.25)
    for n in range(4, 15):
        light = n >= 11
        for s in range(16):
            t = bar(n) + s * BEAT / 4
            if s in (0, 6, 8):
                place(drums, kick_fs(), t, 0.95)
                kicks.append((t, 1.0))
            if s in (4, 12):
                place(drums, clap(), t, 0.36, 0.05)
            if s % 2 == 1 and not (light and s % 4 == 3):
                place(drums, hat(0.05, 0.012, 8500), t, 0.13 if s % 4 == 3 else 0.2, 0.3 if s % 4 == 1 else -0.3)
        root = chord_at(bar(n))[0]
        for s, m in [(0, 0), (3, 0), (6, 12), (8, 0), (11, 7), (14, 12)]:
            place(bass, bass_note(root - 12 + m, BEAT / 4 * 1.7), bar(n) + s * BEAT / 4, 0.55)
        if 8 <= n <= 10:
            tones = chord_at(bar(n))[1]
            for s in range(16):
                place(arp, pluck(tones[[0, 2, 1, 3][s % 4]] + 12, 0.25), bar(n) + s * BEAT / 4, 0.09, 0.3 if s % 2 else -0.3)
        for m in chord_at(bar(n))[1][:3]:
            place(pad, supersaw_note(m, BAR * 1.02, cutoff=1800, a=0.02 if n == 4 else 0.12, r=0.2), bar(n), 0.11)
    for m in [42, 54, 57, 61, 66]:
        place(pad, supersaw_note(m, 3.6, cutoff=1500, a=0.05, r=2.0), bar(15), 0.13)
    for u in C_['unlocks']:
        for m, dt in [(78, 0), (85, 0.06)]:
            place(bells, fm_bell(m, 2.0, tau=0.6), fr(u) + dt, 0.1)
    for m, dt in [(66, 0), (73, 0.05), (78, 0.1), (81, 0.15)]:
        place(bells, fm_bell(m, 4.0, tau=1.4), fr(C_['endTile']) + dt, 0.11)
    return dict(drums=drums, bass=bass, pad=pad, arp=arp, bells=bells, kicks=kicks)


def build_sfx():
    fx, fx_end = buf(), buf()
    outro = bar(15)
    r = np.random.default_rng(5)
    for i, f in enumerate(C_['windows']):
        place(fx, ui_click(0.2), fr(f), 0.28, r.uniform(-0.7, 0.7))
        place(fx, blip(mtof(66 + (i * 5) % 13), True), fr(f), 0.12, r.uniform(-0.7, 0.7))
    a, z = C_['tabCount']
    for k in range(20):
        place(fx, tick(2600 + 60 * k, 0.03, 0.004, 0.5), fr(a) + k * (fr(z) - fr(a)) / 20, 0.1, 0.3)
    place(fx, riser(bar(4) - bar(2, 2), 300, 7000, True, 54), bar(2, 2), 0.2)
    for f in C_['labels']:
        t = fr(f)
        dst = fx_end if t >= outro else fx
        place(dst, snap(0.6, 1.0, mtof(chord_at(t)[0] - 12) * 2), t, 0.5, -0.3)
        place(dst, sub_boom(0.5, 70, 45, 0.08) * 0.5, t, 0.28)
    for f in (C_['shutTabs'], C_['shutRes']):
        place(fx, reverse_suck(0.35), fr(f) - 0.3, 0.3)
        place(fx, snap(0.7, 1.3, mtof(30) * 2), fr(f), 0.55)
        place(fx, sub_boom(2.0, 60, 40, 0.3), fr(f), 0.45)
    for f in C_['clicks']:
        place(fx, key_click(int(f)), fr(f), 0.45)
        place(fx, ui_click(0.15), fr(f), 0.2)
    for f in C_['cuts']:
        place(fx, whoosh(0.3, 600, 3000, 500, peak=0.85), fr(f) - 0.25, 0.14)
    for i, f in enumerate(C_['pops']):
        place(fx, blip(mtof(chord_at(fr(f))[1][i % 3] + 12), True), fr(f), 0.16, -0.4 + 0.1 * (i % 8))
    for i, f in enumerate(C_['flips']):
        place(fx, blip(mtof(chord_at(fr(f))[1][i % 3] + 12), True), fr(f), 0.18)
    for f in C_['zooms']:
        place(fx, whoosh(0.5, 200, 1500, 300, peak=0.4, width=0.4), fr(f), 0.14)
    place(fx, blip(mtof(78), True), fr(C_['toast']), 0.18)
    place(fx, blip(mtof(85), True), fr(C_['toast']) + 0.07, 0.14)
    place(fx, tock(1400, 0.15, 0.03, 0.4), fr(C_['open']), 0.3)
    place(fx, blip(mtof(81), True), fr(C_['download']), 0.2)
    place(fx, blip(mtof(88), True), fr(C_['download']) + 0.08, 0.16)
    place(fx_end, snap(0.8, 1.3, mtof(30) * 2), fr(C_['endTile']), 0.6)
    place(fx_end, sub_boom(2.5, 55, 41, 0.35), fr(C_['endTile']), 0.45)
    place(fx_end, tock(mtof(66) * 2, 0.2, 0.04, 0.6), fr(C_['endName']), 0.35)
    place(fx_end, snap(0.4, 0.5, mtof(54)), fr(C_['endTag']), 0.3)
    return fx, fx_end


def main():
    m = build_music()
    fx, fx_end = build_sfx()
    sc = sidechain(m['kicks'], 0.5, 0.12)
    music = m['drums'] + m['bass'] * sc + m['pad'] * sc + m['arp'] * (0.5 + 0.5 * sc) + m['bells']
    send = filt(m['pad'] * 0.5 + m['arp'] * 0.6 + m['bells'] * 0.8, sos_hp(250))
    music = music + reverb(send, IR_HALL) * 0.26
    bus = envelope([(0, 0.8), (bar(4) - 0.05, 0.8), (bar(4), 1.0), (bar(5), 0.75), (bar(8), 0.85), (bar(11), 0.7), (bar(15), 0.75), (DUR, 0.75)])
    mix = music * bus + fx + reverb(filt(fx, sos_hp(400)), IR_ROOM) * 0.18
    low = filt(mix, sos_lp(120, 2))
    mix = mix - low + low.mean(axis=1, keepdims=True)
    mix = sat(mix * 0.9, 1.1)
    total = C_['total'] / FPS
    t = np.arange(N) / SR
    t0 = fr(C_['endName']) + 0.6
    fade = np.where(t < t0, 1.0, np.clip((total - t) / (total - t0), 0, 1) ** 1.5)
    mix = mix * fade[:, None] + fx_end * np.clip((total - t) / 1.0, 0, 1)[:, None]
    mix = mix[: int(total * SR)]
    meter = pyln.Meter(SR)
    for _ in range(3):
        mix = mix * 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
        mix = limiter(mix, ceiling=0.77)
    print(f'integrated {meter.integrated_loudness(mix):.2f} LUFS, {len(mix) / SR:.3f} s')
    out = os.path.join(ROOT, 'public', 'audio')
    os.makedirs(out, exist_ok=True)
    sf.write(os.path.join(out, 'soundtrack.wav'), mix, SR, subtype='PCM_24')
    q = int(0.25 * SR)
    rms = [20 * np.log10(np.sqrt(np.mean(mix[i:i + q] ** 2)) + 1e-9) for i in range(0, len(mix), q)]
    for name, a, z in [('problem', 0, bar(4)), ('snap', bar(4), bar(5)), ('cohort', bar(5), bar(8)), ('road', bar(8), bar(11)), ('resume', bar(11), bar(15)), ('end', bar(15), total)]:
        seg = rms[int(a * 4):int(z * 4)]
        print(f'{name:8s} mean {sum(seg) / len(seg):6.1f} dB')


if __name__ == '__main__':
    main()
