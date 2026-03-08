import { createCipheriv, createHash, randomBytes } from "crypto";

import { createConnectedAccount } from "./current-user.repository.js";
import { getOrCreateCurrentUser } from "./current-user.service.js";
import { env } from "./config.js";
import { capturePlatformSessionSchema } from "./platform-session.schema.js";
import { listPlatformSessions, upsertPlatformSession } from "./platform-session.repository.js";

function deriveEncryptionKey(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function encryptSessionPayload(payload: unknown) {
  const iv = randomBytes(12);
  const key = deriveEncryptionKey(env.SESSION_ENCRYPTION_KEY);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

export async function getPlatformSessions() {
  const user = await getOrCreateCurrentUser();
  return listPlatformSessions(user.id);
}

export async function capturePlatformSession(payload: unknown) {
  const user = await getOrCreateCurrentUser();
  const input = capturePlatformSessionSchema.parse(payload);

  const encryptedSession = encryptSessionPayload({
    platform: input.platform,
    cookies: input.cookies,
    localStorage: input.localStorage ?? {},
    sessionStorage: input.sessionStorage ?? {},
    userAgent: input.userAgent ?? null,
    capturedAt: new Date().toISOString(),
    metadata: input.metadata ?? {},
  });

  const inferredIdentifier =
    input.accountIdentifier?.trim() ||
    (typeof input.metadata?.pageUrl === "string" ? input.metadata.pageUrl : null) ||
    null;

  const session = await upsertPlatformSession({
    userId: user.id,
    platform: input.platform,
    encryptedSession,
    sessionFormat: "cookie_bundle",
    status: "active",
    accountIdentifier: inferredIdentifier,
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? {},
  });

  await createConnectedAccount(user.id, {
    provider: input.platform,
    accountLabel: `${input.platform.charAt(0).toUpperCase()}${input.platform.slice(1)} primary`,
    connectionStatus: "connected",
    approvalMode: "manual_approval",
    accountIdentifier: inferredIdentifier,
    metadata: {
      sessionCapturedAt: new Date().toISOString(),
      sessionSource: "chrome_extension",
      ...(input.metadata ?? {}),
    },
  });

  return session;
}
