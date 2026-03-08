import { pool } from "./db.js";
import type { PlatformSessionRecord } from "./platform-session.types.js";

function mapPlatformSessionRow(row: Record<string, unknown>): PlatformSessionRecord {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    platform: String(row.platform) as PlatformSessionRecord["platform"],
    sessionFormat: String(row.session_format) as PlatformSessionRecord["sessionFormat"],
    status: String(row.status) as PlatformSessionRecord["status"],
    accountIdentifier: row.account_identifier ? String(row.account_identifier) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
    lastValidatedAt: row.last_validated_at ? new Date(String(row.last_validated_at)).toISOString() : null,
    expiresAt: row.expires_at ? new Date(String(row.expires_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listPlatformSessions(userId: number) {
  const result = await pool.query(
    `SELECT id, user_id, platform, session_format, status, account_identifier, user_agent, metadata, last_validated_at, expires_at, created_at, updated_at
     FROM platform_sessions
     WHERE user_id = $1
     ORDER BY updated_at DESC, id DESC`,
    [userId],
  );

  return result.rows.map(mapPlatformSessionRow);
}

export async function upsertPlatformSession(input: {
  userId: number;
  platform: PlatformSessionRecord["platform"];
  encryptedSession: Buffer;
  sessionFormat: PlatformSessionRecord["sessionFormat"];
  status: PlatformSessionRecord["status"];
  accountIdentifier?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const result = await pool.query(
    `INSERT INTO platform_sessions (
       user_id, platform, encrypted_session, session_format, status, account_identifier, user_agent, metadata, last_validated_at
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,NOW())
     ON CONFLICT (user_id, platform)
     DO UPDATE SET
       encrypted_session = EXCLUDED.encrypted_session,
       session_format = EXCLUDED.session_format,
       status = EXCLUDED.status,
       account_identifier = EXCLUDED.account_identifier,
       user_agent = EXCLUDED.user_agent,
       metadata = EXCLUDED.metadata,
       last_validated_at = NOW(),
       updated_at = NOW()
     RETURNING id, user_id, platform, session_format, status, account_identifier, user_agent, metadata, last_validated_at, expires_at, created_at, updated_at`,
    [
      input.userId,
      input.platform,
      input.encryptedSession,
      input.sessionFormat,
      input.status,
      input.accountIdentifier ?? null,
      input.userAgent ?? null,
      JSON.stringify(input.metadata ?? {}),
    ],
  );

  return mapPlatformSessionRow(result.rows[0]);
}
