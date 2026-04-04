/*
LEEWAY HEADER — DO NOT REMOVE

REGION: UI.COMPONENT.AGENT.BRIDGE
TAG: UI.COMPONENT.AGENT.AGENTLEE.BRIDGE

COLOR_ONION_HEX:
NEON=#FFD700
FLUO=#FFF176
PASTEL=#FFF9C4

ICON_ASCII:
family=lucide
glyph=link

5WH:
WHAT = Named re-export bridge — exposes AgentLeeForm as AgentLee for backward-compatible import paths
WHY = Allows all legacy and new imports of AgentLee to transparently receive the upgraded 3D engine component
WHO = Leeway Innovations / Agent Lee System Engineer
WHERE = components/AgentLee.tsx
WHEN = 2026
HOW = Single-line named export; no logic, no state — pure alias for tree-shaking and import parity

AGENTS:
ASSESS
AUDIT

LICENSE:
MIT
*/

import AgentLeeForm from './AgentLeeForm';

// Re-export AgentLeeForm as AgentLee so all existing imports get the upgraded 3D engine natively.
export const AgentLee = AgentLeeForm;
