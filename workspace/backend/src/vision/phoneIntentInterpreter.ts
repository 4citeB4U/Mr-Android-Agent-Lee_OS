export type PhoneIntent =
  | { type: "open_app"; app: string }
  | { type: "tap_text"; text: string }
  | { type: "navigate_home" };

export function interpretIntent(text: string): PhoneIntent | null {
  const lower = text.toLowerCase();

  if (lower.includes("open telegram")) {
    return { type: "open_app", app: "telegram" };
  }

  if (lower.includes("go home")) {
    return { type: "navigate_home" };
  }

  const tapMatch = lower.match(/tap (.+)/);
  if (tapMatch) {
    return { type: "tap_text", text: tapMatch[1].trim() };
  }

  return null;
}
