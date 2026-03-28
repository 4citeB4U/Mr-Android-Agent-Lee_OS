/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.SDK.PERSISTENCE.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = persistence module
WHY = Part of CORE region
WHO = LEEWAY Align Agent
WHERE = backend\src\services\persistence.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import fs from 'fs';
import path from 'path';

export class PersistenceService {
    private dataDir = path.join(process.cwd(), 'data');
    private stateFile = path.join(this.dataDir, 'state.json');

    constructor() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
    }

    async saveState(state: any) {
        fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        console.log('[persistence] System state consolidated.');
    }

    async loadState(): Promise<any | null> {
        if (!fs.existsSync(this.stateFile)) return null;
        try {
            const data = fs.readFileSync(this.stateFile, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            console.error('[persistence] Failed to load state:', e);
            return null;
        }
    }
}

export const persistenceService = new PersistenceService();
