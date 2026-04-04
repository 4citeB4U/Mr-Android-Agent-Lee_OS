/*
LEEWAY HEADER — DO NOT REMOVE

REGION: MCP.AAA.VALIDATION
TAG: MCP.AAA.VALIDATOR.AGENT

COLOR_ONION_HEX:
NEON=#00E676
FLUO=#69F0AE
PASTEL=#B9F6CA

ICON_ASCII:
family=lucide
glyph=shield-check

5WH:
WHAT = AAA Validator Agent — validates authentication, authorization, and availability for MCP agents
WHY = Ensures every MCP agent is operationally compliant before deployment
WHO = Agent Lee OS — MCP AAA System
WHERE = MCP agents/aaa-helper-agents/aaa-validator-agent.ts
WHEN = 2026
HOW = Calls validate tools for auth, authz, and availability checks on a target agent

AGENTS:
ASSESS
ALIGN
AUDIT
VALIDATE

LICENSE:
PROPRIETARY
*/
// AAA Validator Agent
// Validates AAA compliance and operational readiness
import {
    validateAuthentication,
    validateAuthorization,
    validateAvailability,
} from "./tools/validate";

export async function validateAAA(targetAgent: string) {
  const auth = await validateAuthentication(targetAgent);
  const authz = await validateAuthorization(targetAgent);
  const avail = await validateAvailability(targetAgent);
  return { auth, authz, avail };
}
