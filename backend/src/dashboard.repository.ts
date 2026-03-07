import { pool } from "./db.js";
import type {
  DashboardApplyAttempt,
  DashboardRecentEvent,
  DashboardRecentJob,
  DashboardScannerRun,
  DashboardScannerSource,
  DashboardWatcherActivity,
} from "./dashboard.types.js";

export interface DashboardCounts {
  jobs: number;
  freshJobs: number;
  applications: number;
  referrals: number;
  pausedSessions: number;
  notificationsPending: number;
  fieldMappings: number;
}

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const result = await pool.query<{
    jobs: string;
    fresh_jobs: string;
    applications: string;
    referrals: string;
    paused_sessions: string;
    notifications_pending: string;
    field_mappings: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM jobs) AS jobs,
       (SELECT COUNT(*) FROM jobs WHERE freshness_status = 'fresh') AS fresh_jobs,
       (SELECT COUNT(*) FROM applications) AS applications,
       (SELECT COUNT(*) FROM referrals) AS referrals,
       (SELECT COUNT(*) FROM application_sessions WHERE status <> 'completed') AS paused_sessions,
       (SELECT COUNT(*) FROM notifications WHERE status = 'pending') AS notifications_pending,
       (SELECT COUNT(*) FROM field_mappings) AS field_mappings`,
  );

  const row = result.rows[0];

  return {
    jobs: Number(row.jobs),
    freshJobs: Number(row.fresh_jobs),
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
    freshness_status: string;
    job_priority: string;
    apply_strategy: string;
  }>(
    `SELECT
       jobs.id,
       jobs.company,
       jobs.title,
       jobs.location,
       jobs.discovered_at,
       jobs.freshness_status,
       jobs.job_priority,
       jobs.apply_strategy,
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
    freshnessStatus: row.freshness_status as DashboardRecentJob["freshnessStatus"],
    jobPriority: row.job_priority as DashboardRecentJob["jobPriority"],
    applyStrategy: row.apply_strategy as DashboardRecentJob["applyStrategy"],
    discoveredAt: new Date(row.discovered_at).toISOString(),
  }));
}

export async function getFreshJobs(): Promise<DashboardRecentJob[]> {
  const result = await pool.query<{
    id: string;
    company: string;
    title: string;
    location: string;
    discovered_at: string;
    source_platforms: string[] | null;
    freshness_status: string;
    job_priority: string;
    apply_strategy: string;
  }>(
    `SELECT
       jobs.id,
       jobs.company,
       jobs.title,
       jobs.location,
       jobs.discovered_at,
       jobs.freshness_status,
       jobs.job_priority,
       jobs.apply_strategy,
       ARRAY_REMOVE(ARRAY_AGG(job_sources.source_platform ORDER BY job_sources.source_platform), NULL) AS source_platforms
     FROM jobs
     LEFT JOIN job_sources ON job_sources.job_id = jobs.id
     WHERE jobs.freshness_status = 'fresh'
     GROUP BY jobs.id
     ORDER BY jobs.first_seen_at DESC, jobs.id DESC
     LIMIT 6`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    company: row.company,
    title: row.title,
    location: row.location,
    sourcePlatforms: row.source_platforms ?? [],
    freshnessStatus: row.freshness_status as DashboardRecentJob["freshnessStatus"],
    jobPriority: row.job_priority as DashboardRecentJob["jobPriority"],
    applyStrategy: row.apply_strategy as DashboardRecentJob["applyStrategy"],
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

export async function getWatcherActivities(): Promise<DashboardWatcherActivity[]> {
  const result = await pool.query<{
    watcher_id: string;
    name: string;
    status: string;
    provider: string;
    polling_interval_seconds: string;
    last_run_at: string | null;
    last_success_at: string | null;
    last_error: string | null;
    last_seen_timestamp: string | null;
    recent_discovery_count: string;
    recent_fresh_count: string;
  }>(
    `SELECT
       watchers.id AS watcher_id,
       watchers.name,
       watchers.status,
       watchers.provider,
       watchers.polling_interval_seconds,
       watchers.last_run_at,
       watchers.last_success_at,
       watchers.last_error,
       cursors.last_seen_timestamp,
       COALESCE(SUM(CASE WHEN discovery.event_type = 'job_discovered' THEN 1 ELSE 0 END), 0)::text AS recent_discovery_count,
       COALESCE(SUM(CASE WHEN discovery.event_type = 'fresh_job_detected' THEN 1 ELSE 0 END), 0)::text AS recent_fresh_count
     FROM job_feed_watchers AS watchers
     LEFT JOIN job_feed_cursors AS cursors
       ON cursors.watcher_id = watchers.id
     LEFT JOIN job_discovery_events AS discovery
       ON discovery.watcher_id = watchers.id
      AND discovery.created_at >= NOW() - INTERVAL '24 hours'
     GROUP BY watchers.id, cursors.watcher_id
     ORDER BY watchers.updated_at DESC, watchers.id DESC
     LIMIT 8`,
  );

  return result.rows.map((row) => ({
    watcherId: Number(row.watcher_id),
    name: row.name,
    status: row.status as DashboardWatcherActivity["status"],
    provider: row.provider,
    pollingIntervalSeconds: Number(row.polling_interval_seconds),
    lastRunAt: row.last_run_at ? new Date(row.last_run_at).toISOString() : null,
    lastSuccessAt: row.last_success_at ? new Date(row.last_success_at).toISOString() : null,
    lastError: row.last_error,
    lastSeenTimestamp: row.last_seen_timestamp ? new Date(row.last_seen_timestamp).toISOString() : null,
    recentDiscoveryCount: Number(row.recent_discovery_count),
    recentFreshCount: Number(row.recent_fresh_count),
  }));
}

export async function getRecentApplyAttempts(): Promise<DashboardApplyAttempt[]> {
  const result = await pool.query<{
    id: string;
    job_id: string;
    company: string;
    title: string;
    strategy: string;
    provider: string;
    status: string;
    duration_ms: string | null;
    created_at: string;
  }>(
    `SELECT
       apply_attempts.id,
       apply_attempts.job_id,
       jobs.company,
       jobs.title,
       apply_attempts.strategy,
       apply_attempts.provider,
       apply_attempts.status,
       apply_attempts.duration_ms::text,
       apply_attempts.created_at
     FROM apply_attempts
     INNER JOIN jobs ON jobs.id = apply_attempts.job_id
     ORDER BY apply_attempts.created_at DESC, apply_attempts.id DESC
     LIMIT 8`,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    jobId: Number(row.job_id),
    company: row.company,
    title: row.title,
    strategy: row.strategy as DashboardApplyAttempt["strategy"],
    provider: row.provider,
    status: row.status as DashboardApplyAttempt["status"],
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}
