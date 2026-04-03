import type { UTMParams } from "@/lib/auth-types";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function extractUTM(searchParams: URLSearchParams): UTMParams | null {
  const payload: UTMParams = {
    referrer: typeof document === "undefined" ? undefined : document.referrer || undefined,
  };

  for (const key of UTM_KEYS) {
    const value = searchParams.get(key);

    if (value) {
      payload[key] = value;
    }
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

export function persistUTM(payload: UTMParams | null) {
  if (!payload || typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(payload);
  window.localStorage.setItem("wsb_utm", serialized);
  document.cookie = `wsb_utm=${encodeURIComponent(serialized)}; path=/; max-age=2592000; samesite=lax`;
}

export function readStoredUTM(): UTMParams | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("wsb_utm");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UTMParams;
  } catch {
    return null;
  }
}
