export interface PlatformSessionRecord {
  id: number;
  userId: number;
  platform: "linkedin" | "naukri" | "instahyre" | "hirist";
  sessionFormat: "cookie_bundle";
  status: "active" | "expired" | "revoked";
  accountIdentifier: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
  lastValidatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CapturedPlatformSessionPayload {
  platform: PlatformSessionRecord["platform"];
  accountIdentifier?: string;
  userAgent?: string;
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
  metadata?: Record<string, unknown>;
}
