/*
LEEWAY HEADER — DO NOT REMOVE

REGION: BACKEND
TAG: BACKEND.ROUTES.ADB
PURPOSE: ADB RAG routes — Agent Lee app open/close/tap/list on connected Android device
SECURITY: execFile args array only (no shell interpolation), sovereign handshake required
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render

5WH:
  WHAT = ADB command bridge for Agent Lee phone control
  WHY = Enables Agent Lee to open, close, and interact with Android apps via ADB
  WHO = Agent Lee OS / LEEWAY Innovations
  WHERE = backend/src/routes/adb.ts
  WHEN = 2026
  HOW = execFile with strict arg array, validated package names, auth guard

LICENSE: MIT
*/

import { Router, Request, Response, NextFunction } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const router = Router();

// ── Constants ──────────────────────────────────────────────────────────────────
const SOVEREIGN_TOKEN = process.env.NEURAL_HANDSHAKE ?? 'AGENT_LEE_SOVEREIGN_V1';
/** Valid Android package names: alphanumeric, dots, underscores only */
const PACKAGE_RE = /^[a-zA-Z0-9._]{1,200}$/;
/** Safe upper bound for screen coordinates */
const MAX_COORD = 4096;

// ── Auth guard ─────────────────────────────────────────────────────────────────
router.use((req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-neural-handshake'];
  if (token !== SOVEREIGN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
});

// ── Input validation helpers ───────────────────────────────────────────────────
function validPackage(pkg: unknown): pkg is string {
  return typeof pkg === 'string' && PACKAGE_RE.test(pkg);
}

function validCoord(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= MAX_COORD;
}

// ── Routes ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/adb/launch  { package: "com.example.app" }
 * Opens an installed app by package name.
 */
router.post('/launch', async (req: Request, res: Response) => {
  const { package: pkg } = req.body;
  if (!validPackage(pkg)) {
    return res.status(400).json({ ok: false, error: 'Invalid package name' });
  }
  try {
    await execFileAsync('adb', [
      'shell', 'monkey',
      '-p', pkg,
      '-c', 'android.intent.category.LAUNCHER',
      '1',
    ]);
    res.json({ ok: true, status: 'launched', package: pkg });
  } catch {
    res.status(500).json({ ok: false, error: 'Launch failed' });
  }
});

/**
 * POST /api/adb/stop  { package: "com.example.app" }
 * Force-stops a running app.
 */
router.post('/stop', async (req: Request, res: Response) => {
  const { package: pkg } = req.body;
  if (!validPackage(pkg)) {
    return res.status(400).json({ ok: false, error: 'Invalid package name' });
  }
  try {
    await execFileAsync('adb', ['shell', 'am', 'force-stop', pkg]);
    res.json({ ok: true, status: 'stopped', package: pkg });
  } catch {
    res.status(500).json({ ok: false, error: 'Stop failed' });
  }
});

/**
 * GET /api/adb/packages
 * Returns a list of all 3rd-party installed app package names.
 */
router.get('/packages', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await execFileAsync('adb', ['shell', 'pm', 'list', 'packages', '-3']);
    const packages = stdout
      .split('\n')
      .map((l) => l.replace('package:', '').trim())
      .filter(Boolean);
    res.json({ ok: true, packages });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not list packages' });
  }
});

/**
 * POST /api/adb/tap  { x: number, y: number }
 * Sends a tap event at (x, y) screen coordinates.
 */
router.post('/tap', async (req: Request, res: Response) => {
  const { x, y } = req.body;
  if (!validCoord(x) || !validCoord(y)) {
    return res.status(400).json({ ok: false, error: 'x and y must be numbers in [0, 4096]' });
  }
  try {
    await execFileAsync('adb', [
      'shell', 'input', 'tap',
      String(Math.floor(x)),
      String(Math.floor(y)),
    ]);
    res.json({ ok: true, status: 'tapped', x, y });
  } catch {
    res.status(500).json({ ok: false, error: 'Tap failed' });
  }
});

/**
 * POST /api/adb/swipe  { x1, y1, x2, y2, duration? }
 * Swipe gesture on the screen.
 */
router.post('/swipe', async (req: Request, res: Response) => {
  const { x1, y1, x2, y2, duration = 300 } = req.body;
  if (!validCoord(x1) || !validCoord(y1) || !validCoord(x2) || !validCoord(y2)) {
    return res.status(400).json({ ok: false, error: 'Coordinates must be numbers in [0, 4096]' });
  }
  const ms = Math.min(Math.max(Number(duration) || 300, 50), 5000);
  try {
    await execFileAsync('adb', [
      'shell', 'input', 'swipe',
      String(Math.floor(x1)), String(Math.floor(y1)),
      String(Math.floor(x2)), String(Math.floor(y2)),
      String(ms),
    ]);
    res.json({ ok: true, status: 'swiped' });
  } catch {
    res.status(500).json({ ok: false, error: 'Swipe failed' });
  }
});

/**
 * GET /api/adb/devices
 * Lists connected ADB devices.
 */
router.get('/devices', async (_req: Request, res: Response) => {
  try {
    const { stdout } = await execFileAsync('adb', ['devices']);
    const lines = stdout.split('\n').slice(1).filter(Boolean);
    const devices = lines.map((l) => {
      const [id, state] = l.split('\t');
      return { id: id?.trim(), state: state?.trim() };
    }).filter((d) => d.id);
    res.json({ ok: true, devices });
  } catch {
    res.status(500).json({ ok: false, error: 'Could not list devices' });
  }
});

export { router as adbRouter };
