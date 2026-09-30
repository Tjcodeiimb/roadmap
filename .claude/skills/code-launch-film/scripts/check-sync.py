#!/usr/bin/env python3
"""Fails if the audio in a rendered mp4 is offset from public/audio/soundtrack.wav by more than 1 ms,
or if the delivered (AAC-decoded) audio's true peak is above -1 dBTP.
Usage: python scripts/check-sync.py <video.mp4> [--ffmpeg <path>]"""
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

args = sys.argv[1:]
ffmpeg = 'ffmpeg'
if '--ffmpeg' in args:
    i = args.index('--ffmpeg')
    ffmpeg = __import__('os').path.abspath(args[i + 1])
    del args[i:i + 2]
video = args[0]
ref, sr = sf.read('public/audio/soundtrack.wav', always_2d=True)
# decode through a temp wav (Remotion's bundled ffmpeg has no raw-float muxer)
tmp = 'out/_sync.wav'
subprocess.run([ffmpeg, '-loglevel', 'error', '-y', '-i', video, '-vn', '-ac', '2', '-ar', str(sr), '-c:a', 'pcm_s24le', tmp], check=True)
dec = sf.read(tmp, always_2d=True)[0]
worst = 0
for t in (4.0, 14.0, 28.0):
    a, b = int(t * sr), int((t + 2.0) * sr)
    r = ref[a:b, 0]
    d = dec[a - 4800:b + 4800, 0]
    c = signal.correlate(d, r, mode='valid')
    lag = int(np.argmax(c)) - 4800
    worst = max(worst, abs(lag))
    print(f'  t={t:5.1f}s  lag {lag:+d} samples')
ok = worst <= 48
print('sync OK' if ok else f'sync FAIL: {worst} samples')
tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(dec, 4, 1, axis=0))) + 1e-12)
tp_ok = tp <= -1.0
print(f'true peak {tp:.2f} dBTP ' + ('OK' if tp_ok else 'FAIL (above -1 dBTP)'))
sys.exit(0 if ok and tp_ok else 1)
