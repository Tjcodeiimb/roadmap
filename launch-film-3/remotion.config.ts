import { existsSync } from 'node:fs';
import { Config } from '@remotion/cli/config';

// On Windows, let Remotion download its own headless shell. In the Linux cloud container that
// download is blocked, so use the pre-installed Playwright headless shell when it exists.
const LINUX_SHELL = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
if (process.platform === 'linux' && existsSync(LINUX_SHELL)) Config.setBrowserExecutable(LINUX_SHELL);

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('angle');
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setOverwriteOutput(true);
