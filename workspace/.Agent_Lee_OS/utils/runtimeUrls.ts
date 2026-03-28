/*
LEEWAY HEADER — DO NOT REMOVE

REGION: CORE
TAG: CORE.UTILS.RUNTIMEURLS.MAIN

5WH:
WHAT = Runtime URL helpers for web + Android-hosted Agent Lee UI
WHY = Keep API, WebSocket, and remote control requests pointed at the correct host
WHO = Codex
WHERE = .Agent_Lee_OS/utils/runtimeUrls.ts
WHEN = 2026
HOW = Resolves dynamic Android bridge endpoints first, then Vite env, then browser origin

LICENSE:
MIT
*/

type RuntimeBridge = {
  getApiBaseUrl?: () => string;
  getCerebralBaseUrl?: () => string;
  getBackendBaseUrl?: () => string;
};

const APP_ASSET_HOST = "appassets.androidplatform.net";

function normalizeBase(value: string | null | undefined): string {
  return (value || "").trim().replace(/\/+$/, "");
}

function safelyCall(getter?: () => string): string {
  if (typeof getter !== "function") return "";
  try {
    return normalizeBase(getter());
  } catch {
    return "";
  }
}

export function getRuntimeBridge(): RuntimeBridge | null {
  if (typeof window === "undefined") return null;
  return ((window as any).AndroidHost as RuntimeBridge | undefined) || null;
}

export function isAndroidHostedUi(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.host.includes(APP_ASSET_HOST);
}

export function resolveApiBase(): string {
  const bridge = getRuntimeBridge();
  const bridgeBase =
    safelyCall(bridge?.getApiBaseUrl) || safelyCall(bridge?.getBackendBaseUrl);
  if (bridgeBase) return bridgeBase;

  const envBase = normalizeBase(
    ((import.meta as any).env?.VITE_API_BASE as string | undefined) ||
      ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined),
  );
  if (envBase) return envBase;

  if (typeof window !== "undefined" && /^https?:/i.test(window.location.origin)) {
    const origin = normalizeBase(window.location.origin);
    if (!origin.includes(APP_ASSET_HOST)) return origin;
  }

  return "";
}

export function resolveCerebralBase(): string {
  const bridge = getRuntimeBridge();
  const bridgeBase = safelyCall(bridge?.getCerebralBaseUrl);
  if (bridgeBase) return bridgeBase;

  const envBase = normalizeBase(
    (import.meta as any).env?.VITE_CEREBRAL_BASE_URL as string | undefined,
  );
  if (envBase) return envBase;

  const apiBase = resolveApiBase();
  if (!apiBase) return "http://127.0.0.1:8787";

  try {
    const url = new URL(apiBase);
    return `${url.protocol}//${url.hostname}:8787`;
  } catch {
    return "http://127.0.0.1:8787";
  }
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBase();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function buildWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = resolveApiBase();

  if (!base && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${normalizedPath}`;
  }

  if (!base) return normalizedPath;

  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = normalizedPath;
  url.search = "";
  url.hash = "";
  return url.toString();
}
