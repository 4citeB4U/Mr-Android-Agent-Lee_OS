/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UTIL.CORE.HELPERS
TAG: UTIL.CLASS.MERGE.HELPER

COLOR_ONION_HEX:
NEON=#39FF14
FLUO=#0DFF94
PASTEL=#C7FFD8

ICON_ASCII:
family=lucide
glyph=wrench

5WH:
WHAT = Utility — type-safe className composition helper
WHY = Provides a single cn() function for merging Tailwind classes across all UI components
WHO = Agent Lee OS
WHERE = lib/utils.ts
WHEN = 2026
HOW = Re-exports cn() built from clsx + tailwind-merge for conflict-free class composition

AGENTS:
ASSESS
ALIGN
AUDIT

LICENSE:
PROPRIETARY
*/
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
