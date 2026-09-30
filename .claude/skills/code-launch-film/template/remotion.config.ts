import { Config } from '@remotion/cli/config';

// Do NOT set a browser executable: Remotion downloads its own headless shell.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setChromiumOpenGlRenderer('angle');
Config.setDelayRenderTimeoutInMilliseconds(120000);
Config.setOverwriteOutput(true);
