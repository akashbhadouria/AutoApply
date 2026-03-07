import { pool } from "./db.js";
import type { DashboardRecentEvent, DashboardRecentJob, DashboardScannerRun, DashboardScannerSource } from "./dashboard.types.js";

export interface DashboardCounts {
  jobs: number;
  applications: number;
  referrals: number;
  pausedSessions: number;
  notificationsPending: number;
  fieldMappings: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const result = await pool.query<{
    jobs: string;
    applications: string;
    referrals: string;
    paused_sessions: string;
    notifications_pending: string;
    field_mappings: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM jobs) AS jobs,
       (SELECT COUNT(*) FROM applications) AS applications,
       (SELECT COUNT(*) FROM referrals) AS referrals,
       (SELECT COUNT(*) FROM application_sessions WHERE status <> 'completed') AS paused_sessions,
       (SELECT COUNT(*) FROM notifications WHERE status = 'pending') AS notifications_pending,
       (SELECT COUNT(*) FROM field_mappings) AS field_mappings`,
  );

  const row = result.rows[0];

  return {
    jobs: Number(row.jobs),
    applications: Number(row.applications),
    referrals: Number(row.referrals),
    pausedSessions: Number(row.paused_sessions),
    notificationsPending: Number(row.notifications_pending),
    fieldMappings: Number(row.field_mappings),
  };
}

export async function getApplicationBreakdown() {
  const result = await pool.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM applications
     GROUP BY status
     ORDER BY status ASC`,
  );

  return result.rows.map((row) => ({
    status: row.status,
    count: Number(row.count),
  }));
}

export async function getReferralBreakdown() {
  const result = await pool.query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM referrals
     GROUP BY status
     ORDER BY status ASC`,
  );

  return result.rows.map((row) => ({
    status: row.status,
    count: Number(row.count),
  }));
}

export async function getRecentJobs(): Promise<DashboardRecentJob[]> {
  const result = await pool.query<{
    id: string;
    company: string;
    title: string;
    location: string;
    discovered_at: string;
    source_platforms: string[] | null;
  }>(
    `SELECT
       jobs.id,
       jobs.company,
       jobs.title,
       jobs.location,
       jobs.discovered_at,
       ARRAY_REMOVE(ARRAY_AGG(job_sources.source_platform ORDER BY job_sources.source_platform), NULL) AS source_platforms
     FROM jobs
     LEFT JOIN job_sources ON job_sources.job_id = jobs.id
     GROUP BY jobs.id
     ORDER BY jobs.discovered_at DESC, jobs.id DESC
     LIMIT 5`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    company: row.company,
    title: row.title,
    location: row.location,
    sourcePlatforms: row.source_platforms ?? [],
    discoveredAt: new Date(row.discovered_at).toISOString(),
  }));
}

export async function getRecentEvents(): Promise<DashboardRecentEvent[]> {
  const result = await pool.query<{
    id: string;
    event_type: string;
    actor: string;
    created_at: string;
  }>(
    `SELECT id, event_type, actor, created_at
     FROM events
     ORDER BY created_at DESC, id DESC
     LIMIT 6`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    eventType: row.event_type,
    actor: row.actor,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

function parseScannerSource(value: unknown): DashboardScannerSource | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : null;
  const provider = typeof record.provider === "string" ? record.provider : null;
  const platform = typeof record.platform === "string" ? record.platform : null;
  const mode = record.mode === "live" || record.mode === "fallback" ? record.mode : null;
  const discoveredCount =
    typeof record.discoveredCount === "number"
      ? record.discoveredCount
      : typeof record.discoveredCount === "string"
        ? Number(record.discoveredCount)
        : NaN;

  if (!name || !provider || !platform || !mode || Number.isNaN(discoveredCount)) {
    return null;
  }

  return {
    name,
    provider,
    platform,
    mode,
    discoveredCount,
    error: typeof record.error === "string" ? record.error : undefined,
  };
}

export async function getLatestScannerRun(): Promise<DashboardScannerRun | null> {
  const result = await pool.query<{
    id: string;
    created_at: string;
    payload: Record<string, unknown> | null;
  }>(
    `SELECT id, created_at, payload
     FROM events
     WHERE event_type = 'job_scanner.run_requested'
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const payload = row.payload ?? {};
  const searchTitles = Array.isArray(payload.searchTitles)
    ? payload.searchTitles.filter((entry): entry is string => typeof entry === "string")
    : [];
  const locations = Array.isArray(payload.locations)
    ? payload.locations.filter((entry): entry is string => typeof entry === "string")
    : [];
  const recencyDays =
    typeof payload.recencyDays === "number"
      ? payload.recencyDays
      : typeof payload.recencyDays === "string"
        ? Number(payload.recencyDays)
        : 0;
  const discoveredCount =
    typeof payload.discoveredCount === "number"
      ? payload.discoveredCount
      : typeof payload.discoveredCount === "string"
        ? Number(payload.discoveredCount)
        : 0;
  const sources = Array.isArray(payload.scannerSources)
    ? payload.scannerSources
        .map((entry) => parseScannerSource(entry))
        .filter((entry): entry is DashboardScannerSource => entry !== null)
    : [];

  return {
    eventId: Number(row.id),
    createdAt: new Date(row.created_at).toISOString(),
    searchTitles,
    locations,
    recencyDays: Number.isFinite(recencyDays) ? recencyDays : 0,
    discoveredCount: Number.isFinite(discoveredCount) ? discoveredCount : 0,
    sources,
  };
}
