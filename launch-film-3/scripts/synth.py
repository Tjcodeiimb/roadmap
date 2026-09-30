#!/usr/bin/env python3
"""
Synth library for a code-built film soundtrack: DSP helpers, instruments, reverb, sidechain, limiter.
It contains NO score. Write the film's own score in soundtrack.py: start that file with
    exec(open(os.path.join(os.path.dirname(__file__), 'synth.py')).read())
(or copy this file's contents to the top), then add build_music(), build_sfx() and main().
See references/sound-design.md in the skill for the structure of those three functions.

Reads out/cues.json (exported from the same timeline the picture uses).
Everything is deterministic (seeded), so re-running reproduces the exact mix.
"""
import json
import os
import sys

import numpy as np
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CUES = json.load(open(os.path.join(ROOT, 'out', 'cues.json')))
FPS = CUES['fps']
DUR = CUES['total'] / FPS + 1.2  # tail rendered, trimmed/faded at the end
N = int(DUR * SR)
BPM = CUES['bpm']
BEAT = 60.0 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(7)


def fr(frame):
    """frame → seconds"""
    return frame / FPS


def bar(n, beat=0.0):
    """1-indexed bar, beat offset → seconds"""
    return (n - 1) * BAR + beat * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------------------------------
# buffers
# ---------------------------------------------------------------------------------------
def buf():
    return np.zeros((N, 2), dtype=np.float64)


def place(dst, x, t, gain=1.0, pan=0.0):
    """Add mono or stereo signal x into dst at time t (seconds) with constant-power pan."""
    i = int(round(t * SR))
    if i >= N:
        return
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        x = np.stack([x * np.cos(a), x * np.sin(a)], axis=1)
    x = x.copy()
    nf = min(len(x), int(0.006 * SR))
    w = np.cos(np.linspace(0, np.pi / 2, nf)) ** 2
    x[-nf:] *= w[:, None]
    if i < 0:
        x = x[-i:]
        i = 0
    n = min(len(x), N - i)
    dst[i:i + n] += x[:n] * gain


def tt(d):
    return np.arange(int(d * SR)) / SR


# ---------------------------------------------------------------------------------------
# DSP helpers
# ---------------------------------------------------------------------------------------
def sos_lp(f, order=2):
    return signal.butter(order, min(f, SR * 0.45), 'low', fs=SR, output='sos')


def sos_hp(f, order=2):
    return signal.butter(order, max(f, 10), 'high', fs=SR, output='sos')


def sos_bp(lo, hi, order=2):
    return signal.butter(order, [max(lo, 10), min(hi, SR * 0.45)], 'band', fs=SR, output='sos')


def filt(x, sos):
    return signal.sosfilt(sos, x, axis=0)


def sweep_filter(x, cutoffs, kind='low', q_order=2, block=256):
    """Time-varying filter: cutoffs is an array (per sample) of cutoff Hz. Processed in blocks."""
    y = np.zeros_like(x)
    zi = None
    for s in range(0, len(x), block):
        c = float(np.mean(cutoffs[s:s + block]))
        if kind == 'low':
            sos = sos_lp(c, q_order)
        elif kind == 'high':
            sos = sos_hp(c, q_order)
        else:
            sos = sos_bp(c / 1.35, c * 1.35, q_order)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2) + x.shape[1:])
        seg, zi = signal.sosfilt(sos, x[s:s + block], axis=0, zi=zi)
        y[s:s + block] = seg
    return y


def noise(d):
    return rng.standard_normal(int(d * SR))


def expdec(d, tau):
    return np.exp(-tt(d) / tau)


def adsr(d, a=0.005, dcy=0.1, s=0.7, r=0.2):
    n = int(d * SR)
    env = np.ones(n) * s
    na, nd, nr = int(a * SR), int(dcy * SR), int(r * SR)
    na = max(1, min(na, n))
    env[:na] = np.linspace(0, 1, na)
    if na + nd < n:
        env[na:na + nd] = np.linspace(1, s, nd)
    if nr > 0 and nr < n:
        env[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return env


def saw_blep(freq, d, phase0=0.0):
    """PolyBLEP band-limited saw with (optionally) time-varying frequency array."""
    n = int(d * SR)
    f = np.full(n, freq) if np.isscalar(freq) else freq[:n]
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    # polyBLEP
    m1 = ph < dt
    t1 = ph[m1] / dt[m1]
    y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt
    t2 = (ph[m2] - 1) / dt[m2]
    y[m2] -= t2 * t2 + t2 + t2 + 1
    return y


def sine(freq, d, phase0=0.0):
    n = int(d * SR)
    f = np.full(n, freq) if np.isscalar(freq) else freq[:n]
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f) / SR))


def sat(x, drive=1.5):
    return np.tanh(x * drive) / np.tanh(drive)


def make_ir(rt60=2.4, pre=0.02, lp=6500, width=1.0, seed=3):
    r = np.random.default_rng(seed)
    d = rt60 * 1.2
    n = int(d * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / rt60)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)], axis=1) * env[:, None]
    # darken the tail over time (air absorption)
    ir = filt(ir, sos_lp(lp, 1))
    mid = ir.mean(axis=1, keepdims=True)
    ir = mid + (ir - mid) * width
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2))


IR_HALL = make_ir(2.8, 0.025, 5500, 1.0, 3)
IR_ROOM = make_ir(0.7, 0.008, 7000, 0.8, 5)


def reverb(x, ir):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    y = np.stack([signal.fftconvolve(x[:, 0], ir[:, 0])[:len(x)], signal.fftconvolve(x[:, 1], ir[:, 1])[:len(x)]], axis=1)
    return y


def pingpong(x, delay_s, fb=0.35, mix=0.3, lp=4000):
    d = int(delay_s * SR)
    y = np.zeros_like(x)
    tap = x.copy()
    for k in range(1, 7):
        tap = filt(tap, sos_lp(lp, 1)) * fb
        sh = d * k
        if sh >= len(x):
            break
        side = 0 if k % 2 else 1
        y[sh:, side] += tap[:len(x) - sh, side] + tap[:len(x) - sh, 1 - side] * 0.3
    return x + y * mix / fb


# ---------------------------------------------------------------------------------------
# instruments
# ---------------------------------------------------------------------------------------
def kick(d=0.9, hard=1.0):
    t = tt(d)
    f = mtof(32) + 110 * np.exp(-t / 0.035) + 40 * np.exp(-t / 0.006)  # settles on Ab1: in key with every bass root
    body = sine(f, d) * np.exp(-t / (0.26 * hard + 0.05))
    click = filt(noise(d), sos_hp(2500)) * np.exp(-t / 0.0025) * 0.35
    return sat(body * 1.1 + click, 1.8) * 0.9


def sub_boom(d=2.5, f0=52, f1=36, glide=0.4):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t / glide)
    x = sine(f, d) * np.exp(-t / 0.9)
    x += sine(f * 2, d) * np.exp(-t / 0.25) * 0.25
    x = sat(x, 1.4)
    thump = filt(noise(d), sos_lp(180, 2)) * np.exp(-t / 0.05) * 0.6
    return x * 0.9 + thump


def clap(d=0.45):
    t = tt(d)
    n = filt(noise(d), sos_bp(900, 5200, 2))
    env = np.zeros_like(t)
    for k, off in enumerate([0, 0.009, 0.019, 0.028]):
        env += (t >= off) * np.exp(-np.maximum(t - off, 0) / (0.006 if k < 3 else 0.11))
    return n * env * 0.8


def hat(d=0.12, tau=0.018, bright=7500):
    t = tt(d)
    x = filt(noise(d), sos_hp(bright, 2))
    # a bit of metallic ring
    ring = sum(np.sin(2 * np.pi * f * t) for f in (8100, 10900, 13300)) * 0.08
    return (x + ring) * np.exp(-t / tau) * 0.5


def tick(freq=3200, d=0.05, tau=0.006, body=0.6):
    t = tt(d)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / tau) * body
    x += filt(noise(d), sos_hp(5000)) * np.exp(-t / 0.0015) * 0.5
    return x


def tock(freq=1100, d=0.12, tau=0.03, low=0.4):
    """Wooden landing sound: resonant band + little low thump."""
    t = tt(d)
    n = noise(d) * np.exp(-t / 0.004)
    res = filt(n, sos_bp(freq * 0.85, freq * 1.18, 2)) * 6
    res *= np.exp(-t / tau)
    th = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.025) * low
    return res + th


def key_click(seed):
    r = np.random.default_rng(seed)
    d = 0.05
    t = tt(d)
    f = 2400 + r.random() * 2200
    x = filt(noise(d), sos_bp(f * 0.7, f * 1.3, 2)) * np.exp(-t / (0.004 + r.random() * 0.004))
    x += np.sin(2 * np.pi * (180 + r.random() * 60) * t) * np.exp(-t / 0.012) * 0.25
    return x * (0.55 + r.random() * 0.35)


def ui_click(d=0.25):
    t = tt(d)
    c = filt(noise(d), sos_hp(3000)) * np.exp(-t / 0.0012)
    ping = np.sin(2 * np.pi * 1850 * t) * np.exp(-t / 0.03) * 0.35
    low = np.sin(2 * np.pi * (95 + 40 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.05) * 0.8
    return c * 0.8 + ping + low


def snap(d=0.6, weight=1.0, root=51.91):
    """Logo-lock snap: tight click + body + short tail, tuned to the chord root under it."""
    t = tt(d)
    c = filt(noise(d), sos_bp(1800, 9000, 2)) * np.exp(-t / 0.003) * 1.2
    body = sine(4 * root * (1 + 0.8 * np.exp(-t / 0.008)), d) * np.exp(-t / 0.045) * 0.7
    low = sine(root * (1 + 0.5 * np.exp(-t / 0.02)), d) * np.exp(-t / 0.16) * weight
    return sat(c + body + low, 1.3)


def fm_bell(midi, d=3.0, idx=2.2, ratio=3.5, tau=1.2):
    d = max(d, 5 * tau)
    t = tt(d)
    fc = mtof(midi)
    mod = np.sin(2 * np.pi * fc * ratio * t) * idx * np.exp(-t / 0.35)
    x = np.sin(2 * np.pi * fc * t + mod) * np.exp(-t / tau)
    x += np.sin(2 * np.pi * fc * 2.0 * t) * np.exp(-t / (tau * 0.35)) * 0.15
    att = np.minimum(1, t / 0.003)
    return x * att


def whoosh(d=0.8, f0=180, f1=1400, f2=300, peak=0.55, width=1.0, air=0.12):
    """Camera-move whoosh: brown+pink-ish noise through a moving band; peak = max camera velocity."""
    n = int(d * SR)
    t = np.arange(n) / SR
    u = t / d
    cut = np.where(u < peak, f0 * (f1 / f0) ** (u / peak), f1 * (f2 / f1) ** ((u - peak) / (1 - peak)))
    def colored():
        w = noise(d)
        brown = np.cumsum(w)
        brown = filt(brown, sos_hp(30, 2))
        brown /= np.max(np.abs(brown)) + 1e-9
        return brown * 0.7 + filt(w, sos_lp(4000, 1)) * 0.3
    x = np.stack([colored(), colored()], axis=1)
    y = sweep_filter(x, cut, 'band') * 2.2
    a = filt(np.stack([noise(d), noise(d)], axis=1), sos_hp(4000, 2)) * air
    env = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) * d / 0.18))
    y = (y + a) * env[:, None]
    pan = np.linspace(-0.6 * width, 0.6 * width, n)
    ang = (pan + 1) * np.pi / 4
    y[:, 0] *= np.cos(ang) * 1.4
    y[:, 1] *= np.sin(ang) * 1.4
    return y


def blip(f0=587.33, up=True, d=0.12):
    """Word-reveal blip: a short sine with an upward (or downward) glide and one slap echo."""
    t = tt(d)
    if up:
        f = f0 * 1.5 ** (1 - np.exp(-t / 0.01))
    else:
        f = f0 * 0.53 ** (1 - np.exp(-t / 0.012))
    x = sine(f, d) + sine(2 * f, d) * 0.1
    x *= np.minimum(1, t / 0.001) * np.exp(-t / 0.012)
    out = np.zeros(int((d + 0.06) * SR))
    out[: len(x)] += x
    e = int(0.055 * SR)
    out[e: e + len(x)] += x * 0.35
    return out


def riser(d=2.0, f0=250, f1=7000, tone=True, midi=56):
    n = int(d * SR)
    t = np.arange(n) / SR
    u = t / d
    cut = f0 * (f1 / f0) ** (u ** 1.3)
    x = np.stack([noise(d), noise(d)], axis=1)
    y = sweep_filter(x, cut, 'band') * (u ** 2.2)[:, None] * 0.9
    if tone:
        f = mtof(midi) * 2 ** (u ** 2 * 1.0)
        s = (saw_blep(f, d) * 0.5 + saw_blep(f * 1.005, d) * 0.5)
        s = sweep_filter(s, 400 + 5000 * u ** 2, 'low') * (u ** 2.5) * 0.35
        y += np.stack([s, s], axis=1)
    return y


def reverse_suck(d=0.5):
    x = whoosh(d, 6000, 900, 200, peak=0.85)
    return x


def supersaw_note(midi, d, voices=5, detune=0.10, cutoff=1800, a=0.25, r=0.8, bright_env=None):
    tot = np.zeros((int(d * SR), 2))
    for v in range(voices):
        off = (v - (voices - 1) / 2) / ((voices - 1) / 2 + 1e-9) * detune
        f = mtof(midi + off)
        s = saw_blep(f, d, phase0=rng.random())
        pan = (v / (voices - 1) - 0.5) * 1.4
        ang = (pan + 1) * np.pi / 4
        tot[:, 0] += s * np.cos(ang)
        tot[:, 1] += s * np.sin(ang)
    tot /= voices
    if bright_env is not None:
        tot = sweep_filter(tot, bright_env[:len(tot)], 'low')
    else:
        tot = filt(tot, sos_lp(cutoff, 2))
    env = adsr(d, a, 0.3, 0.85, r)
    return tot * env[:, None]


def pluck(midi, d=0.5, cutoff0=5200, cutoff1=500, tau_f=0.09, tau_a=0.22):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    s = saw_blep(f, d) * 0.6 + np.sign(np.sin(2 * np.pi * f * 1.0 * t + 0.3)) * 0.18 + sine(f * 2, d) * 0.1
    cut = cutoff1 + (cutoff0 - cutoff1) * np.exp(-t / tau_f)
    y = sweep_filter(s, cut, 'low', 2, 128)
    return y * np.exp(-t / tau_a) * np.minimum(1, t / 0.002)


def bass_note(midi, d, drive=1.3):
    n = int(d * SR)
    t = np.arange(n) / SR
    f = mtof(midi)
    x = sine(f, d) + sine(f * 2, d) * 0.22 + saw_blep(f, d) * 0.06
    x = filt(x, sos_lp(900, 2))
    x = sat(x, drive) * adsr(d, 0.006, 0.12, 0.8, 0.08)
    return x


def sidechain(kicks, depth=0.55, tau=0.14):
    g = np.ones(N)
    t = np.arange(N) / SR
    for (kt, kg) in kicks:
        i = int(kt * SR)
        seg = t[i:i + int(0.6 * SR)] - kt
        g[i:i + len(seg)] = np.minimum(g[i:i + len(seg)], 1 - depth * kg * np.exp(-seg / tau))
    return g[:, None]


def limiter(x, ceiling=0.89, look=0.004, release=0.08):
    # true-peak aware: detect on a 4x oversampled copy so inter-sample overs are caught too
    up = signal.resample_poly(x, 4, 1, axis=0)
    a4 = np.max(np.abs(up), axis=1)
    a = a4[: (len(a4) // 4) * 4].reshape(-1, 4).max(axis=1)
    a = np.pad(a, (0, max(0, len(x) - len(a))))[: len(x)]
    la = int(look * SR)
    peak = np.maximum.reduce([np.roll(a, -k) for k in range(0, la, 8)])
    gain = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    win = np.hanning(max(3, la))
    win /= win.sum()
    gain = np.minimum(gain, np.convolve(gain, win, mode='same'))
    rel = np.exp(-1 / (release * SR))
    out = np.empty_like(gain)
    g = 1.0
    for i in range(len(gain)):
        g = gain[i] if gain[i] < g else gain[i] + (g - gain[i]) * rel
        out[i] = g
    return x * out[:, None]


def envelope(points):
    """Piecewise-linear gain automation from (time, gain) points, smoothed."""
    t = np.arange(N) / SR
    ts, gs = zip(*points)
    g = np.interp(t, ts, gs)
    return filt(g, sos_lp(4, 1))[:, None]


