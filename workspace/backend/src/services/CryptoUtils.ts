/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTIL
TAG: CORE.SDK.CRYPTOUTILS.MAIN

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=file

5WH:
WHAT = CryptoUtils module
WHY = Part of UTIL region
WHO = LEEWAY Align Agent
WHERE = backend\src\services\CryptoUtils.ts
WHEN = 2026
HOW = Auto-aligned by LEEWAY align-agent

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
MIT
*/

import crypto from 'crypto';

/**
 * CRYPTO UTILITY
 * Handles HMAC-SHA256 signing and verification.
 */

export class CryptoUtils {
    static sign(message: string, secret: string): string {
        return crypto.createHmac('sha256', secret).update(message).digest('hex');
    }

    static verifySignature(message: string, signature: string, secret: string): boolean {
        const expectedSignature = this.sign(message, secret);
        try {
            return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
        } catch (e) {
            return false;
        }
    }

    static generateNonce(): string {
        return crypto.randomBytes(16).toString('hex');
    }
}
