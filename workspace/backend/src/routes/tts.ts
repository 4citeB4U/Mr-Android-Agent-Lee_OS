/*
LEEWAY HEADER — DO NOT REMOVE
PROFILE: LEEWAY-RUNTIME
TAG: BACKEND.SERVICES.TTS
REGION: 🔴 BACKEND
*/

import { Router, Request, Response } from 'express';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink, readFile as fsReadFile } from 'fs/promises';
import { termuxTtsService } from '../services/termuxTts.js';

const execFileAsync = promisify(execFile);

// Allowlisted voices — never pass arbitrary strings to edge-tts CLI
const ALLOWED_VOICES = new Set([
  'en-US-GuyNeural',
  'en-US-JennyNeural',
  'en-US-ChristopherNeural',
  'en-US-EricNeural',
  'Charon',
]);
const router = Router();

// Text-to-Speech configuration
interface TTSRequest {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Synthesize speech using edge-tts via execFile (no shell interpolation)
async function synthesizeSpeech(options: TTSRequest): Promise<Buffer | null> {
  const { text } = options;
  // Validate and sanitize voice — only allowlisted values reach the CLI
  const rawVoice = options.voice || 'en-US-GuyNeural';
  const voice = ALLOWED_VOICES.has(rawVoice) ? rawVoice : 'en-US-GuyNeural';

  if (!text || text.length > 500) return null;

  try {
    const audioPath = join(tmpdir(), `tts_${Date.now()}.mp3`);

    // execFile with args array — no shell, no injection possible
    await execFileAsync('edge-tts', [
      '--voice', voice,
      '--text', text,
      '--write-media', audioPath,
    ]);

    const audio = await fsReadFile(audioPath);
    await unlink(audioPath).catch(() => {});
    return audio;
  } catch (error) {
    console.error('TTS synthesis failed:', error);
    return null;
  }
}

// POST /api/tts/speak - Synthesize and return audio
router.post('/speak', async (req: Request, res: Response) => {
  try {
    const options: TTSRequest = req.body;

    if (!options.text) {
      return res.status(400).json({
        status: 'error',
        message: 'Text is required',
      });
    }

    const audio = await synthesizeSpeech(options);

    if (!audio) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to synthesize speech',
      });
    }

    // Return audio as MP3
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/tts/voices - List available voices (Legacy/Unified)
router.get('/voices', async (req: Request, res: Response) => {
  try {
    const engines = await termuxTtsService.getAvailableEngines();
    const currentEngine = termuxTtsService.getEngine();
    
    res.json({
      status: 'success',
      data: {
        engines,
        currentEngine,
        edgeVoices: [
          'en-US-GuyNeural',
          'en-US-JennyNeural',
          'en-GB-RyanNeural',
          'en-AU-Will',
          'en-AU-Natasha',
        ],
        default: 'en-US-GuyNeural',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/tts/engines - List available Termux engines
router.get('/engines', async (req: Request, res: Response) => {
  try {
    const engines = await termuxTtsService.getAvailableEngines();
    res.json({ status: 'success', engines });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/tts/select - Set preferred engine or voice
router.post('/select', async (req: Request, res: Response) => {
  try {
    const { engine, voice, mode } = req.body;
    if (engine) {
      termuxTtsService.setEngine(engine);
    }
    // Logic for persisting mode (premium vs system) could go here
    res.json({ status: 'success', active: { engine, voice, mode } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/tts/profiles - Read voice_profiles.json
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    // Look for voice_profiles.json — env override, then cwd, then repo root
    const candidates = [
      ...(process.env.VOICE_PROFILES_PATH ? [process.env.VOICE_PROFILES_PATH] : []),
      join(process.cwd(), 'voice_profiles.json'),
      join(process.cwd(), '..', 'voice_profiles.json'),
    ];
    
    let content = null;
    for (const p of candidates) {
      try {
        const raw = await fsReadFile(p, 'utf8');
        content = JSON.parse(raw);
        break;
      } catch { continue; }
    }
    
    if (!content) {
      return res.status(404).json({ status: 'error', message: 'voice_profiles.json not found' });
    }
    
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;


