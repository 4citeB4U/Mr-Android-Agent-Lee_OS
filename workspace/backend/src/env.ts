/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.ENV.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = env module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\env.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env.local')
];

const envPath = envCandidates.find(candidate => fs.existsSync(candidate));
if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}
