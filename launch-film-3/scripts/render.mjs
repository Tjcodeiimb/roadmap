// Render the film on any OS: cues → soundtrack → muted picture (Remotion) → mux (ffmpeg) → sync check.
// Remotion's own AAC mux leaves encoder priming in the stream, so the audio is attached here and verified.
// Usage: node scripts/render.mjs <out.mp4> [--crf=16]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
process.chdir(root);
const out = process.argv[2] ?? 'out/film.mp4';
const crf = (process.argv.find((a) => a.startsWith('--crf=')) ?? '--crf=16').split('=')[1];
const win = process.platform === 'win32';
const npx = win ? 'npx.cmd' : 'npx';
const py = existsSync('../.venv/Scripts/python.exe') ? '../.venv/Scripts/python.exe' : existsSync('../.venv/bin/python') ? '../.venv/bin/python' : 'python3';
const ffmpeg = win ? path.resolve('node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe') : path.resolve('node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg');
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit', shell: win && cmd.endsWith('.cmd') });

mkdirSync('out', { recursive: true });
run(npx, ['tsx', 'scripts/export-cues.ts']);
run(py, ['scripts/soundtrack.py']);
if (process.argv.includes('--blur')) {
  // film-style motion blur: measure on-screen speed on a sharp render, render sub-frames, average in float
  run(npx, ['remotion', 'render', 'Launch', 'out/_sharp.mp4', '--muted', '--crf=12', '--x264-preset=veryfast', '--log=error']);
  run(py, ['scripts/measure-speed.py', 'out/_sharp.mp4', 'out/samples.json']);
  run(npx, ['remotion', 'render', 'LaunchSub', 'out/_sub.mp4', '--props=out/samples.json', '--muted', '--crf=6', '--x264-preset=veryfast', '--pixel-format=yuv444p', '--log=error']);
  run(py, ['scripts/accumulate.py', 'out/_sub.mp4', 'out/samples.json', 'out/_picture.mp4']);
} else {
  run(npx, ['remotion', 'render', 'Launch', 'out/_picture.mp4', '--muted', `--crf=${crf}`, '--x264-preset=slow', '--log=error']);
}
run(ffmpeg, ['-loglevel', 'error', '-y', '-i', 'out/_picture.mp4', '-i', 'public/audio/soundtrack.wav', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', out]);
run(py, ['scripts/check-sync.py', out, '--ffmpeg', ffmpeg]);
console.log('rendered', out);
