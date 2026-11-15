// Runs Parkie's vision agent (services/parkie-vision) next to the API, so the parking camera is live whenever the app is:
// the agent loops the demo video as the camera of one lot, streams it to the staff dashboard and reports occupancy.
// It starts only when PARKIE_VIDEO points to an existing file; PARKIE_AGENT=0 turns it off.
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../..');
const AGENT_DIR = path.join(ROOT, 'services', 'parkie-vision');
const DEFAULT_VIDEO = 'C:\\Users\\qubsz\\Downloads\\demo3.MOV';
const RETRY_BACKOFF_MS = 5000; // Parkie's RETRY_BACKOFF

export const PARKIE_LOT_ID = process.env.PARKIE_LOT_ID || 'lot-iulius-p5-09';
export const PARKIE_FEED_PORT = Number(process.env.PARKIE_FEED_PORT || 8090);

let child: ChildProcess | null = null;
let running = false;
let stopping = false;
let video = '';

export function parkieAgentStatus() {
  return { running, lotId: PARKIE_LOT_ID, port: PARKIE_FEED_PORT, video: video ? path.basename(video) : null };
}

function launch(apiPort: number) {
  const python = process.platform === 'win32' ? 'python' : 'python3';
  child = spawn(python, ['-m', 'ai_vision.vision_agent', '--serve', '--video', video, '--port', String(PARKIE_FEED_PORT)], {
    cwd: AGENT_DIR,
    env: {
      ...process.env,
      PYTHONUTF8: '1',
      PYTHONUNBUFFERED: '1',
      BACKEND_URL: `http://localhost:${apiPort}`,
      LOT_ID: PARKIE_LOT_ID,
      PARKIE_AGENT_TOKEN: process.env.PARKIE_AGENT_TOKEN || 'dev_admin',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  running = true;
  const log = (buf: Buffer) => {
    for (const line of buf.toString().split(/\r?\n/)) if (line.trim()) console.log(`[PARKIE AGENT] ${line}`);
  };
  child.stdout?.on('data', log);
  child.stderr?.on('data', log);
  child.on('exit', (code) => {
    running = false;
    child = null;
    if (stopping) return;
    console.warn(`[PARKIE AGENT] stopped (code ${code}), restarting in ${RETRY_BACKOFF_MS / 1000}s`);
    setTimeout(() => launch(apiPort), RETRY_BACKOFF_MS);
  });
}

export function startParkieAgent(apiPort: number) {
  if (process.env.PARKIE_AGENT === '0' || child) return;
  video = process.env.PARKIE_VIDEO || DEFAULT_VIDEO;
  if (!fs.existsSync(video)) {
    console.warn(`[PARKIE AGENT] not started: video not found (${video}). Set PARKIE_VIDEO.`);
    return;
  }
  if (!fs.existsSync(path.join(AGENT_DIR, 'ai_vision', 'vision_agent.py'))) {
    console.warn(`[PARKIE AGENT] not started: ${AGENT_DIR} is missing.`);
    return;
  }
  console.log(`[PARKIE AGENT] starting on ${path.basename(video)} for ${PARKIE_LOT_ID}, feed on port ${PARKIE_FEED_PORT}`);
  launch(apiPort);
  const stop = () => {
    stopping = true;
    child?.kill();
  };
  process.once('exit', stop);
  process.once('SIGINT', () => { stop(); process.exit(0); });
  process.once('SIGTERM', () => { stop(); process.exit(0); });
}
