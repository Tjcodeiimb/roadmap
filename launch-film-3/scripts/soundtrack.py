#!/usr/bin/env python3
"""Score for "The Climb" v2: 104 BPM, 16 bars, warm lo-fi that lifts. Key of D.

  bar 1 - 2.1  ground: no drums; dusty detuned keys (Bbmaj7), crackle, paper thuds; hush before the tile
  bar 2.1      the tile: sub boom, first bright chord; stone thunks as the steps rise
  bar 3        overview + numbers: kick and shaker, counter ticks
  bars 4-14    swung groove Dmaj7 - Bm7 - Gmaj7 - A6; + arp from the course; bells on skills;
               hats thin under the CV printer; hush before the summit; brightest at level up
  bar 14.3-16  CTA: drums out on the cut; keys and pad resolve on Dmaj9, "sent" blip, tail
"""
import os

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'synth.py')).read())

import soundfile as sf
import pyloudnorm as pyln

C_ = CUES
# (bass root, chord tones) per bar
DARK = [(46, [58, 62, 65, 69]), (45, [57, 60, 64, 67]), (43, [55, 58, 62, 65])]  # Bbmaj7, Am7, Gm7
LIGHT = [(38, [54, 57, 61, 64]), (47, [59, 62, 66, 69]), (43, [55, 59, 62, 66]), (45, [57, 61, 64, 66])]  # Dmaj7 Bm7 Gmaj7 A6
DMAJ9 = (38, [54, 57, 61, 64, 66])


def chord_bar(n):
    if n <= 1:
        return DARK[0]
    if bar(n) >= fr(CUES['acts']['cta']['from']) - 0.01:
        return DMAJ9
    return LIGHT[(n - 2) % 4]


AB = CUES['actBeats']


def ab(beats):
    """Seconds at a beat count from the top."""
    return beats * BEAT


def chord_at(t):
    return chord_bar(int(t // BAR) + 1)


def keys(midi, d, wob=0.0):
    """Electric-piano-ish FM tone with a slow tremolo; wob detunes (in semitones) for the dusty part."""
    d = max(d, 2.5)
    t = tt(d)
    fc = mtof(midi + wob)
    mod = np.sin(2 * np.pi * fc * t) * 1.1 * np.exp(-t / 0.5)
    x = np.sin(2 * np.pi * fc * t + mod) * np.exp(-t / 1.3)
    x += np.sin(2 * np.pi * fc * 2 * t) * np.exp(-t / 0.3) * 0.12
    x *= 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    return x * np.minimum(1, t / 0.004)


def kick_d(d=0.7):
    t = tt(d)
    f = mtof(26) + 95 * np.exp(-t / 0.03) + 30 * np.exp(-t / 0.006)  # settles on D1
    body = sine(f, d) * np.exp(-t / 0.24)
    click = filt(noise(d), sos_hp(1800)) * np.exp(-t / 0.002) * 0.2
    return sat(body + click, 1.5) * 0.85


def snare_lofi(d=0.35):
    t = tt(d)
    n = filt(noise(d), sos_bp(700, 4200, 2)) * np.exp(-t / 0.07)
    tone = sine(190, d) * np.exp(-t / 0.05) * 0.4
    return filt(n + tone, sos_lp(5200)) * 0.8


def shaker(d=0.09):
    t = tt(d)
    return filt(noise(d), sos_bp(4500, 11000, 2)) * np.minimum(1, t / 0.012) * np.exp(-t / 0.03) * 0.5


def thud(d=0.3, f0=150):
    """Soft paper/card landing: low filtered knock."""
    t = tt(d)
    x = filt(noise(d), sos_lp(900, 2)) * np.exp(-t / 0.03)
    x += sine(f0 * (1 + 0.5 * np.exp(-t / 0.02)), d) * np.exp(-t / 0.06) * 0.6
    return x


def stone(midi):
    """A heavy block locking into place, tuned."""
    t = tt(0.9)
    x = sine(mtof(midi), 0.9) * np.exp(-t / 0.22) + sine(mtof(midi) * 2.01, 0.9) * np.exp(-t / 0.08) * 0.3
    x += filt(noise(0.9), sos_lp(600, 2)) * np.exp(-t / 0.04) * 0.8
    return sat(x, 1.3)


def crackle(d):
    n = int(d * SR)
    r = np.random.default_rng(3)
    x = np.zeros(n)
    idx = r.integers(0, n, int(d * 26))
    x[idx] = r.uniform(-1, 1, len(idx)) * r.uniform(0.2, 1, len(idx))
    x = filt(x, sos_bp(1200, 7000, 1)) * 0.8
    hiss = filt(r.standard_normal(n), sos_bp(2500, 9000, 1)) * 0.012
    return x + hiss


SW = 0.18  # swing on the off 16ths, as a fraction of a 16th


def s16(n, s):
    return bar(n) + s * BEAT / 4 + (SW * BEAT / 4 if s % 2 else 0)


def build_music():
    drums, bass, pad, arp, bells, keysb, dust = buf(), buf(), buf(), buf(), buf(), buf(), buf()
    kicks = []
    r = np.random.default_rng(11)
    tile = fr(C_['tile'])
    cut = fr(C_['acts']['cta']['from'])
    # ground: detuned keys, lazy rolled chord, crackle
    root, tones = DARK[0]
    for j, m in enumerate(tones):
        place(keysb, keys(m, BAR, r.normal(0, 0.12)), 0.02 + 0.035 * j, 0.16, -0.3 + 0.2 * j)
    place(keysb, keys(tones[2] + 12, BEAT * 2, r.normal(0, 0.15)), bar(1, 2.5), 0.08, 0.4)
    place(bass, bass_note(root - 12, BAR * 0.9), 0.0, 0.28)
    place(dust, crackle(DUR), 0.0, 1.0)
    # the tile: first bright chord
    for j, m in enumerate(LIGHT[0][1]):
        place(keysb, keys(m, BAR * 1.5), tile + 0.02 * j, 0.2, -0.3 + 0.2 * j)
        place(pad, supersaw_note(m, BAR * 1.6, cutoff=1400, a=0.3, r=1.0), tile, 0.07)
    # bar 3: kick + shaker under the numbers
    for s in range(16):
        t = s16(3, s)
        if s in (0, 10):
            place(drums, kick_d(), t, 0.8)
            kicks.append((t, 0.8))
        if s % 2 == 1:
            place(drums, shaker(), t, 0.14, 0.25)
    groove_from = 4
    for n in range(3, int(fr(CUES['acts']['cta']['from']) // BAR) + 2):
        root, tones = chord_bar(n)
        rs = ab(AB['resume'])
        for s in range(16):
            t = s16(n, s)
            if t >= cut - 0.01 or n < groove_from:
                continue
            thin = rs <= t < ab(AB['level'])
            hush = ab(AB['level'] - 0.5) <= t < ab(AB['level'])
            if hush:
                continue
            if s in (0, 7, 10):
                place(drums, kick_d(), t, 0.9 if s == 0 else 0.7)
                kicks.append((t, 1.0 if s == 0 else 0.7))
            if s in (4, 12):
                place(drums, snare_lofi(), t, 0.42, 0.08)
            if s % 2 == 1 or (not thin and s % 2 == 0 and s not in (0, 4, 8, 12)):
                if not (thin and s % 4 == 3):
                    place(drums, hat(0.06, 0.014, 7000), t, 0.09 if s % 2 else 0.05, 0.3 if s % 4 == 1 else -0.25)
        if n >= groove_from:
            for s, m, ln in [(0, 0, 3), (3, 0, 1), (6, 12, 1.5), (8, 7, 2), (11, 0, 1), (14, 12, 1.5)]:
                t = s16(n, s)
                if t < cut - 0.01 and not (ab(AB['level'] - 0.5) <= t < ab(AB['level'])):
                    place(bass, bass_note(root - 12 + m, BEAT / 4 * ln), t, 0.5)
            for s in (2, 10):
                if s16(n, s) < cut:
                    for j, m in enumerate(tones):
                        place(keysb, keys(m, BEAT), s16(n, s) + 0.012 * j, 0.1, -0.3 + 0.2 * j)
        if n >= 3 and bar(n) < cut:
            bright = ab(AB['level']) <= bar(n) + 0.01
            for m in tones[:3]:
                place(pad, supersaw_note(m, min(BAR * 1.02, cut - bar(n) + 0.1), cutoff=2600 if bright else 1300, a=0.15, r=0.3), bar(n), 0.09 if bright else 0.06)
        # arp from the course on, 8ths; 16ths at the summit
        for s in range(16):
            t = s16(n, s)
            if t < ab(AB['course']) or t >= cut or (ab(AB['resume']) <= t < ab(AB['level'])):
                continue
            fast = t >= ab(AB['level'])
            if not fast and s % 2:
                continue
            m = tones[[0, 1, 2, 3, 2, 1][(s // (1 if fast else 2)) % 6]] + 12
            place(arp, pluck(m, 0.3, 4200, 600), t, 0.06 if fast else 0.07, 0.35 if s % 4 else -0.35)
    # CTA: resolve
    root, tones = DMAJ9
    for j, m in enumerate(tones):
        place(keysb, keys(m, 5.0), cut + 0.04 * j, 0.23, -0.4 + 0.2 * j)
        place(pad, supersaw_note(m, 5.5, cutoff=1500, a=0.4, r=2.0), cut, 0.06)
    place(bass, bass_note(root - 12, BAR * 1.5), cut, 0.4)
    for j, m in enumerate([66, 69, 73, 76]):
        place(keysb, keys(m, 3.0), fr(C_['ctaLine']) + 0.06 * j, 0.1, 0.3)
    # bells: skills badges, level crossings
    for i, f in enumerate(C_['badges']):
        place(bells, fm_bell(74 + [0, 2, 4, 7][i], 1.8, tau=0.5), fr(f), 0.09, 0.3)
    for i, f in enumerate(C_['crossings']):
        for k, dt in enumerate((0, 0.07)):
            place(bells, fm_bell([69, 73, 76][i] + 7 * k, 2.2, tau=0.7), fr(f) + dt, 0.1)
    return dict(drums=drums, bass=bass, pad=pad, arp=arp, bells=bells, keys=keysb, dust=dust, kicks=kicks)


def build_sfx():
    fx, fx_end = buf(), buf()
    r = np.random.default_rng(5)
    CUT = fr(C_['acts']['cta']['from'])
    for l in C_['lands']:
        place(fx, thud(0.3, 120 + 60 * r.random()), fr(l['f']), 0.35, l['x'] * 0.7)
    for f in C_['lines'] + C_['titles'][1::2] + [C_['ctaWant'], C_['ctaLine']]:
        place(fx if fr(f) < CUT else fx_end, tock(mtof(chord_at(fr(f))[1][0] + 24), 0.1, 0.02, 0.3), fr(f), 0.18, -0.2)
    for f in C_['titles'][0::2]:
        place(fx, snap(0.35, 0.6, mtof(chord_at(fr(f))[0])), fr(f), 0.28, -0.4)
    for f in C_['stamps']:
        dst = fx_end if fr(f) >= CUT else fx
        place(dst, snap(0.6, 1.2, mtof(38) * 2), fr(f), 0.45)
        place(dst, thud(0.35, 90), fr(f), 0.4)
    # the tile: hush, then boom
    place(fx, reverse_suck(0.45), fr(C_['tile']) - 0.45, 0.3)
    place(fx, sub_boom(2.8, 60, 37, 0.35), fr(C_['tile']), 0.6)
    place(fx, snap(0.8, 1.4, mtof(38) * 2), fr(C_['tile']), 0.55)
    for k in range(10):
        place(fx, thud(0.25, 180 + 40 * r.random()), fr(C_['tile']) + 0.04 + k * 0.035, 0.12, r.uniform(-0.9, 0.9))
    for i, f in enumerate(C_['rises']):
        place(fx, stone(38 + [0, 4, 7, 9, 12][i]), fr(f), 0.4, -0.3 + 0.15 * i)
    for i, f in enumerate(C_['stats']):
        place(fx, snap(0.4, 0.8, mtof(LIGHT[1][1][i] - 12)), fr(f), 0.3, -0.6 + 0.4 * i)
        for k in range(8):
            place(fx, tick(2600 + 120 * k, 0.025, 0.004, 0.4), fr(f) + 0.02 + k * 0.055, 0.05, -0.6 + 0.4 * i)
    place(fx, riser(fr(C_['climbWin'][1][1]) - fr(C_['stats'][0]), 200, 5000, True, 50), fr(C_['stats'][0]), 0.1)
    place(fx, key_click(3), fr(C_['enroll']), 0.35)
    for i, f in enumerate(C_['stickers']):
        place(fx, snap(0.45, 0.9, mtof(chord_at(fr(f))[1][i] + 12)), fr(f), 0.3, 0.5)
        place(fx, thud(0.25, 160), fr(f), 0.25, 0.5)
    for i, f in enumerate(C_['fill']):
        place(fx, blip(mtof(LIGHT[3][1][i % 4] + 12 + (12 if i == 4 else 0)), True, 0.09), fr(f), 0.13, 0.5)
    place(fx, ui_click(0.15), fr(C_['resCard']), 0.2, -0.5)
    place(fx, ui_click(0.15), fr(C_['tray']), 0.2, -0.5)
    for i, f in enumerate(C_['passes']):
        place(fx, blip(mtof(73 + 2 * i), True, 0.1), fr(f), 0.12, 0.5)
    for f, (a, z) in zip(C_['climbs'], C_['climbWin']):
        d = max(0.5, fr(z - a) * 1.1)
        place(fx, whoosh(d, 160, 1200, 280, peak=(f - a) / (z - a) / 1.1, width=0.8, air=0.1), fr(a), 0.16)
    place(fx, ui_click(0.15), fr(C_['pass']), 0.25)
    for i, f in enumerate(C_['fan']):
        place(fx, blip(mtof(LIGHT[2][1][i % 4] + 12), True, 0.1), fr(f), 0.12, -0.5 + 0.25 * i)
        place(fx, thud(0.15, 300), fr(f), 0.1, -0.5 + 0.25 * i)
    for i, f in enumerate(C_['ticks']):
        place(fx, key_click(int(f)), fr(f) - 0.03, 0.35)
        place(fx, pluck(74 + [0, 3, 5, 7][i], 0.4, 5000, 800), fr(f), 0.2, 0.2)
    for k in range(3):
        place(fx, tick(220, 0.06, 0.02, 0.9), fr(C_['buzz']) + k * 0.07, 0.3, -0.5)
    place(fx, blip(mtof(78), True), fr(C_['buzz']) + 0.05, 0.16, -0.5)
    place(fx, blip(mtof(85), True), fr(C_['buzz']) + 0.13, 0.13, -0.5)
    place(fx, fm_bell(81, 1.5, tau=0.4), fr(C_['card']), 0.08, -0.5)
    for i, f in enumerate(C_['badges']):
        place(fx, thud(0.2, 220), fr(f), 0.18, 0.4)
    for f in C_['prints']:
        for k in range(6):
            place(fx, tick(1500 + 300 * r.random(), 0.03, 0.006, 0.7), fr(f) + k * 0.028, 0.14, 0.4)
    for i, f in enumerate(C_['chips']):
        place(fx, whoosh(0.25, 600, 2500, 800, peak=0.8, width=0.3), fr(f) - 0.23, 0.07)
        place(fx, blip(mtof(LIGHT[0][1][i % 4] + 12), True, 0.1), fr(f), 0.15, 0.3)
    a, z = C_['roll']
    for k in range(int((fr(z) - fr(a)) / 0.045)):
        place(fx, tick(2400 + 40 * k, 0.025, 0.004, 0.4), fr(a) + k * 0.045, 0.05, 0.1)
    place(fx, riser(fr(z) - fr(a), 300, 6000, True, 62), fr(a), 0.1)
    for k in range(18):
        place(fx, tick(3000 + 2000 * r.random(), 0.04, 0.008, 0.3), fr(z) + 0.02 + k * 0.04, 0.07, r.uniform(-0.9, 0.9))
    # CTA
    place(fx_end, snap(0.6, 1.0, mtof(50)), fr(C_['acts']['cta']['from']), 0.3)
    for f in C_['keys']:
        place(fx_end, key_click(int(f)), fr(f), 0.4, 0.4)
    place(fx_end, ui_click(0.2), fr(C_['send']), 0.3, 0.4)
    place(fx_end, whoosh(0.3, 800, 3000, 1200, peak=0.3, width=0.3), fr(C_['send']), 0.1, 0.4)
    place(fx_end, blip(mtof(81), True, 0.1), fr(C_['send']) + 0.08, 0.2, 0.4)
    place(fx_end, blip(mtof(88), True, 0.12), fr(C_['send']) + 0.16, 0.16, 0.4)
    place(fx_end, blip(mtof(78), False, 0.1), fr(C_['seen']), 0.1, 0.4)
    return fx, fx_end


def main():
    m = build_music()
    fx, fx_end = build_sfx()
    sc = sidechain(m['kicks'], 0.45, 0.13)
    music = m['drums'] + m['bass'] * sc + m['pad'] * sc + m['keys'] * (0.6 + 0.4 * sc) + m['arp'] * (0.5 + 0.5 * sc) + m['bells']
    # lo-fi tone for the dusty opening: low-pass the music bus before the tile, open it after
    t = np.arange(N) / SR
    cut = fr(C_['tile'])
    music = np.where((t < cut - 0.02)[:, None], filt(music, sos_lp(2600, 2)), music)
    send = filt(m['pad'] * 0.5 + m['keys'] * 0.6 + m['arp'] * 0.6 + m['bells'] * 0.8, sos_hp(250))
    music = music + reverb(send, IR_HALL) * 0.24
    T, L, CT = fr(C_['tile']), ab(AB['level']), fr(C_['acts']['cta']['from'])
    bus = envelope([
        (0, 0.9), (T - 0.4, 0.9), (T - 0.3, 0.15), (T - 0.02, 0.15), (T, 1.0),
        (ab(AB['cohort']), 0.85), (ab(AB['resume']), 0.75), (L - 0.35, 0.75), (L - 0.25, 0.15), (L - 0.02, 0.15), (L, 1.0),
        (CT - 0.02, 1.0), (CT, 0.85), (DUR, 0.85)])
    dust = m['dust'] * envelope([(0, 1.0), (T, 1.0), (T + 1.2, 0.25), (CT, 0.25), (CT + 1.5, 0.6), (DUR, 0.6)])
    mix = music * bus + dust + fx + reverb(filt(fx, sos_hp(400)), IR_ROOM) * 0.16
    low = filt(mix, sos_lp(120, 2))
    mix = mix - low + low.mean(axis=1, keepdims=True)
    mix = sat(mix * 0.9, 1.1)
    total = C_['total'] / FPS
    t0 = total - 2.2
    fade = np.where(t < t0, 1.0, np.clip((total - t) / (total - t0), 0, 1) ** 1.5)
    mix = mix * fade[:, None] + fx_end * np.clip((total - t) / 0.8, 0, 1)[:, None]
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
    names = ['ground', 'turn', 'cohort', 'course', 'skills', 'resume', 'level', 'cta']
    edges = [ab(AB[k]) for k in names] + [total]
    segs = [(n, edges[i], edges[i + 1]) for i, n in enumerate(names)] + [('hush', fr(C_['tile']) - 0.3, fr(C_['tile'])), ('hush2', ab(AB['level']) - 0.25, ab(AB['level']))]
    for name, a, z in segs:
        seg = rms[int(a * 4):max(int(a * 4) + 1, int(z * 4))]
        print(f'{name:8s} mean {sum(seg) / len(seg):6.1f} dB')


if __name__ == '__main__':
    main()
