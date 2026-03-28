/*
LEEWAY HEADER — DO NOT REMOVE

REGION: AI
TAG: CORE.SDK.BRAIN.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = brain module
WHY = Part of AI region
WHO = LEEWAY Align Agent
WHERE = backend\src\routes\brain.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

/**
 * /api/brain — Diagnostics proxy to the Python Brain Router (port 8004)
 *
 * Routes:
 *   GET  /api/brain/status      → full ai-status (adapter perf, reward, episodes)
 *   GET  /api/brain/episodes    → recent episode feed
 *   POST /api/brain/teach       → teacher distillation
 *   POST /api/brain/expand      → synthetic expansion
 */

import { Router }  from 'express';
import { getBrainStatus, getRecentEpisodes, teachBrain, expandEpisode, getDriftData } from '../services/BrainRouter.js';

export const brainApiRouter = Router();

brainApiRouter.get('/status', async (_req, res) => {
    try {
        const data = await getBrainStatus();
        res.json(data);
    } catch (err: any) {
        res.status(502).json({ ok: false, error: err.message });
    }
});

brainApiRouter.get('/episodes', async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    try {
        const data = await getRecentEpisodes(limit);
        res.json(data);
    } catch (err: any) {
        res.status(502).json({ ok: false, error: err.message });
    }
});

brainApiRouter.post('/teach', async (req, res) => {
    const { prompt, domain = 'auto' } = req.body || {};
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt required' });
    try {
        const data = await teachBrain(prompt, domain);
        res.json(data);
    } catch (err: any) {
        res.status(502).json({ ok: false, error: err.message });
    }
});

brainApiRouter.post('/expand', async (req, res) => {
    const { episode_id = '' } = req.body || {};
    try {
        const data = await expandEpisode(episode_id);
        res.json(data);
    } catch (err: any) {
        res.status(502).json({ ok: false, error: err.message });
    }
});

brainApiRouter.get('/drift', async (_req, res) => {
    try {
        const data = await getDriftData();
        res.json(data);
    } catch (err: any) {
        res.status(502).json({ ok: false, error: err.message });
    }
});
