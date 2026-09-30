# Windows setup

## Requirements

- Node 20 or newer (`node -v`)
- Python 3.11 or newer (`python --version`)
- About 2 GB free disk; a motion-blurred render writes a large temporary file

No separate ffmpeg install is needed.

## Steps

1. **Pick a short folder.** For example `C:\Projects\myfilm`. The full path to any file inside
   `node_modules` or the virtualenv must stay under 260 characters. Deep temp or AppData folders
   fail in two ways: Remotion's Chromium download unpacks to a broken path, and `pip install numpy`
   stops with `WinError 206`.
2. **Create the project.** Copy this skill's `template/` into `C:\Projects\myfilm\film`, then:
   ```
   cd C:\Projects\myfilm\film
   npm install
   ```
   Add the fonts the film uses (for example an `@fontsource-variable/...` package) and the app's
   icon library if it has one.
3. **Python environment**, one level up so it is shared:
   ```
   cd C:\Projects\myfilm
   python -m venv .venv
   .venv\Scripts\python -m pip install numpy scipy soundfile pyloudnorm opencv-python-headless pillow imageio-ffmpeg
   ```
4. **Copy the scripts.** Copy this skill's `scripts/*` into `film\scripts\`.
5. **Pre-flight.** Add a trivial composition, then:
   ```
   npx remotion still <CompositionId> out/test.png
   ```
   The first run downloads a headless Chromium. Open the PNG. Do not write acts until this works.

## Known problems and fixes

| Symptom | Cause | Fix |
|---|---|---|
| `Failed to launch the browser process … ENOENT` | Project path too long, or a browser path set in the config | Move to a short path; do not call `Config.setBrowserExecutable` |
| `WinError 206 The filename or extension is too long` during pip | Virtualenv path too long | Create the venv in a short path |
| `bash: …/render.sh` or `python3: command not found` | Shell scripts written for Linux | Use the Node and Python scripts in this skill; call `python`, not `python3` |
| `FileNotFoundError` when Python starts ffmpeg | Relative path with forward slashes | Pass an absolute path (`os.path.abspath`) |
| ffmpeg: `Requested output format 'f32le' is not known`, or no `fps`/`tile` filter | Remotion's bundled ffmpeg is a reduced build | Use it only for muxing and simple decode; for raw pipes and filters use `imageio_ffmpeg.get_ffmpeg_exe()` |
| `spawn npx ENOENT` from Node | Windows needs the `.cmd` shim | Spawn `npx.cmd` with `shell: true` (see `render.mjs`) |
| Working directory "moves" between commands | `cd` persists in the shell tool | Start each command with an explicit `cd` to the project, or use absolute paths |
| `package.json must be actual JSON` | File written through a shell heredoc with backslashes | Write JSON with a file-writing tool, not a heredoc |

## Which ffmpeg for what

- **Mux audio, decode to WAV:** `node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe`
- **Raw frame pipes, filters, contact sheets from video:** `imageio_ffmpeg.get_ffmpeg_exe()` in Python

## Render times (rough, 16-core laptop)

- Sharp 30 s film at 1080p60: about a minute
- Motion-blurred master: 5–15 minutes (renders roughly 5× the frames, then averages them)

## Commands

```
npm run studio                                  interactive preview
node scripts/render.mjs out/film.mp4            sharp cut: cues → soundtrack → picture → mux → sync check
node scripts/render.mjs out/film.mp4 --blur     final master with motion blur
..\.venv\Scripts\python scripts\sheet.py <Comp> <from> <to> <every> out\sheet.png [cols] [scale]
```

`render.mjs` expects `scripts/export-cues.ts` and `scripts/soundtrack.py` to exist in the project,
a `Launch` composition that accepts `muted`, and a `LaunchSub` composition (both in the template).
If the film has no soundtrack yet, render with `npx remotion render Launch out/film.mp4 --muted`.
