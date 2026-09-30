#!/usr/bin/env python3
"""Contact sheet: renders every Nth frame of a composition range and tiles them with frame labels.
Usage: python scripts/sheet.py <CompositionId> <from> <to> <every> <out.png> [cols] [scale]"""
import os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

comp, a, b, every, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
cols = int(sys.argv[6]) if len(sys.argv) > 6 else 4
scale = float(sys.argv[7]) if len(sys.argv) > 7 else 0.25
tmp = tempfile.mkdtemp(prefix='sheet', dir=os.path.join(os.path.dirname(__file__), '..', 'out'))
npx = 'npx.cmd' if os.name == 'nt' else 'npx'
subprocess.run([npx, 'remotion', 'render', comp, tmp, '--sequence', f'--frames={a}-{b}', f'--every-nth-frame={every}',
                '--image-format=jpeg', f'--scale={scale}', '--log=error'], check=True)
files = sorted(f for f in os.listdir(tmp) if f.endswith('.jpeg') or f.endswith('.jpg'))
ims = [Image.open(os.path.join(tmp, f)) for f in files]
w, h = ims[0].size
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 4) + 4, rows * (h + 4) + 4), (128, 128, 128))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype('arial.ttf', 14)
except OSError:
    font = ImageFont.load_default()
for i, im in enumerate(ims):
    x, y = 4 + (i % cols) * (w + 4), 4 + (i // cols) * (h + 4)
    sheet.paste(im, (x, y))
    fr = a + i * every
    label = f'f{fr}'
    d.rectangle([x, y, x + 60, y + 18], fill=(0, 0, 0))
    d.text((x + 4, y + 2), label, fill=(255, 255, 255), font=font)
sheet.save(out)
shutil.rmtree(tmp, ignore_errors=True)
print(out, len(ims), 'frames')
