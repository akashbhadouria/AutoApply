"use client";

type PlatformProvider = "linkedin" | "naukri" | "instahyre" | "hirist";

interface CapturedPlatformSessionPayload {
  platform: PlatformProvider;
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    expirationDate?: number;
  }>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

declare global {
  interface WindowEventMap {
    "autoapply:ping": CustomEvent;
    "autoapply:extension-ready": CustomEvent;
    "autoapply:capture-session": CustomEvent<{ platform: PlatformProvider }>;
    "autoapply:session-captured": CustomEvent<CapturedPlatformSessionPayload>;
    "autoapply:session-capture-error": CustomEvent<{ platform: PlatformProvider; error: string }>;
  }
}

export async function detectAutoApplyExtension(timeoutMs = 1200) {
  if (typeof window === "undefined") {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      window.removeEventListener("autoapply:extension-ready", handleReady);
      resolve(false);
    }, timeoutMs);

    function handleReady() {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.removeEventListener("autoapply:extension-ready", handleReady);
      resolve(true);
    }

    window.addEventListener("autoapply:extension-ready", handleReady, { once: true });
    window.dispatchEvent(new CustomEvent("autoapply:ping"));
  });
}

export async function capturePlatformSessionViaExtension(platform: PlatformProvider) {
  if (typeof window === "undefined") {
    throw new Error("Extension capture only works in the browser.");
  }

  const isReady = await detectAutoApplyExtension();
  if (!isReady) {
    throw new Error("AutoApply Chrome extension not detected. Load the extension first.");
  }

  const payload = await new Promise<CapturedPlatformSessionPayload>((resolve, reject) => {
    function cleanup() {
      window.removeEventListener("autoapply:session-captured", handleCaptured);
      window.removeEventListener("autoapply:session-capture-error", handleError);
    }

    function handleCaptured(event: WindowEventMap["autoapply:session-captured"]) {
      if (event.detail.platform !== platform) {
        return;
      }
      cleanup();
      resolve(event.detail);
    }

    function handleError(event: WindowEventMap["autoapply:session-capture-error"]) {
      if (event.detail.platform !== platform) {
        return;
      }
      cleanup();
      reject(new Error(event.detail.error));
    }

    window.addEventListener("autoapply:session-captured", handleCaptured);
    window.addEventListener("autoapply:session-capture-error", handleError);
    window.dispatchEvent(
      new CustomEvent("autoapply:capture-session", {
        detail: { platform },
      }),
    );
  });

  const response = await fetch("/api/platform-sessions/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "Failed to save captured platform session.";
    try {
      const errorPayload = (await response.json()) as { error?: string };
      message = errorPayload.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json();
}
