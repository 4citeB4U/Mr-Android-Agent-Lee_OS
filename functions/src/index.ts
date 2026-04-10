/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE.FUNCTION.ENTRY
TAG: CORE.FUNCTION.FIREBASE.ENTRY

COLOR_ONION_HEX:
NEON=#FF6F00
FLUO=#FF8F00
PASTEL=#FFE0B2

ICON_ASCII:
family=lucide
glyph=zap

5WH:
WHAT = Firebase Functions entry point — exports all deployed cloud functions
WHY = Registers leewayProxy and leewayStream as Firebase-deployed HTTP functions
WHO = Agent Lee OS — Firebase Functions
WHERE = functions/src/index.ts
WHEN = 2026
HOW = Firebase Admin SDK initialization followed by named function re-exports

AGENTS:
ASSESS
AUDIT

LICENSE:
PROPRIETARY
*/
import * as admin from 'firebase-admin';
import { leewayProxy, leewayStream } from './leewayProxy';

admin.initializeApp();

export { leewayProxy, leewayStream };

