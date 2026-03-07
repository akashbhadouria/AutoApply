import { pool } from "./db.js";
import type {
  ConnectedAccountRecord,
  CurrentUserRecord,
  JobDiscoveryEventRecord,
  JobFeedCursorRecord,
  JobFeedWatcherRecord,
  JobWatcherActivityRecord,
  RecentJobDiscoveryEventRecord,
  UserJobPreferencesRecord,
} from "./current-user.types.js";

function mapUserRow(row: Record<string, unknown>): CurrentUserRecord {
  return {
    id: Number(row.id),
    email: String(row.email),
    notificationEmail: row.notification_email ? String(row.notification_email) : null,
    fullName: String(row.full_name),
    phone: row.phone ? String(row.phone) : null,
    whatsappNumber: row.whatsapp_number ? String(row.whatsapp_number) : null,
    location: row.location ? String(row.location) : null,
    linkedinUrl: row.linkedin_url ? String(row.linkedin_url) : null,
    telegramUsername: row.telegram_username ? String(row.telegram_username) : null,
    telegramChatId: row.telegram_chat_id ? String(row.telegram_chat_id) : null,
    portfolioUrl: row.portfolio_url ? String(row.portfolio_url) : null,
    githubUrl: row.github_url ? String(row.github_url) : null,
    resumeUrl: row.resume_url ? String(row.resume_url) : null,
    resumeStoragePath: row.resume_storage_path ? String(row.resume_storage_path) : null,
    onboardingCompleted: Boolean(row.onboarding_completed),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapPreferencesRow(row: Record<string, unknown>): UserJobPreferencesRecord {
  return {
    userId: Number(row.user_id),
    preferredRoles: Array.isArray(row.preferred_roles) ? row.preferred_roles.map(String) : [],
    preferredLocations: Array.isArray(row.preferred_locations) ? row.preferred_locations.map(String) : [],
    remotePreference: String(row.remote_preference) as UserJobPreferencesRecord["remotePreference"],
    referralPreference: String(row.referral_preference) as UserJobPreferencesRecord["referralPreference"],
    instantApplyEnabled: Boolean(row.instant_apply_enabled),
    blockedCompanies: Array.isArray(row.blocked_companies) ? row.blocked_companies.map(String) : [],
    targetApplicationsPerDay: Number(row.target_applications_per_day),
    notificationChannels: Array.isArray(row.notification_channels)
      ? row.notification_channels.map((channel) => String(channel) as UserJobPreferencesRecord["notificationChannels"][number])
      : ["dashboard"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapConnectedAccountRow(row: Record<string, unknown>): ConnectedAccountRecord {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    provider: String(row.provider) as ConnectedAccountRecord["provider"],
    accountLabel: String(row.account_label),
    connectionStatus: String(row.connection_status) as ConnectedAccountRecord["connectionStatus"],
    approvalMode: String(row.approval_mode) as ConnectedAccountRecord["approvalMode"],
    accountIdentifier: row.account_identifier ? String(row.account_identifier) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : {},
    lastCheckedAt: row.last_checked_at ? new Date(String(row.last_checked_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapWatcherRow(row: Record<string, unknown>): JobFeedWatcherRecord {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    name: String(row.name),
    sourcePlatform: String(row.source_platform) as JobFeedWatcherRecord["sourcePlatform"],
    provider: String(row.provider) as JobFeedWatcherRecord["provider"],
    status: String(row.status) as JobFeedWatcherRecord["status"],
    pollingIntervalSeconds: Number(row.polling_interval_seconds),
    searchTitles: Array.isArray(row.search_titles) ? row.search_titles.map(String) : [],
    locations: Array.isArray(row.locations) ? row.locations.map(String) : [],
    recencyDays: Number(row.recency_days),
    configuration: row.configuration && typeof row.configuration === "object" ? (row.configuration as Record<string, unknown>) : {},
    lastRunAt: row.last_run_at ? new Date(String(row.last_run_at)).toISOString() : null,
    lastSuccessAt: row.last_success_at ? new Date(String(row.last_success_at)).toISOString() : null,
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapJobFeedCursorRow(row: Record<string, unknown>): JobFeedCursorRecord {
  return {
    watcherId: Number(row.watcher_id),
    lastSeenJobId: row.last_seen_job_id ? String(row.last_seen_job_id) : null,
    lastSeenTimestamp: row.last_seen_timestamp ? new Date(String(row.last_seen_timestamp)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapJobDiscoveryEventRow(row: Record<string, unknown>): JobDiscoveryEventRecord {
  return {
    id: Number(row.id),
    watcherId: row.watcher_id == null ? null : Number(row.watcher_id),
    jobId: row.job_id == null ? null : Number(row.job_id),
    eventType: String(row.event_type) as JobDiscoveryEventRecord["eventType"],
    payload: row.payload && typeof row.payload === "object" ? (row.payload as Record<string, unknown>) : {},
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function getCurrentUser() {
  const result = await pool.query(`SELECT * FROM users ORDER BY id ASC LIMIT 1`);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
}

export async function saveCurrentUser(input: {
  email: string;
  notificationEmail?: string;
  fullName: string;
  phone?: string;
  whatsappNumber?: string;
  location?: string;
  linkedinUrl?: string;
  telegramUsername?: string;
  telegramChatId?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  resumeStoragePath?: string;
  onboardingCompleted?: boolean;
}) {
  const existing = await getCurrentUser();

  if (!existing) {
    const inserted = await pool.query(
      `INSERT INTO users (
         email, notification_email, full_name, phone, whatsapp_number, location, linkedin_url, telegram_username, telegram_chat_id, portfolio_url, github_url, resume_url, resume_storage_path, onboarding_completed
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        input.email,
        input.notificationEmail ?? input.email,
        input.fullName,
        input.phone ?? null,
        input.whatsappNumber ?? input.phone ?? null,
        input.location ?? null,
        input.linkedinUrl ?? null,
        input.telegramUsername ?? null,
        input.telegramChatId ?? null,
        input.portfolioUrl ?? null,
        input.githubUrl ?? null,
        input.resumeUrl ?? null,
        input.resumeStoragePath ?? null,
        input.onboardingCompleted ?? false,
      ],
    );

    return mapUserRow(inserted.rows[0]);
  }

  const updated = await pool.query(
    `UPDATE users
     SET email = $2,
         notification_email = $3,
         full_name = $4,
         phone = $5,
         whatsapp_number = $6,
         location = $7,
         linkedin_url = $8,
         telegram_username = $9,
         telegram_chat_id = $10,
         portfolio_url = $11,
         github_url = $12,
         resume_url = $13,
         resume_storage_path = $14,
         onboarding_completed = $15,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      existing.id,
      input.email,
      input.notificationEmail ?? input.email,
      input.fullName,
      input.phone ?? null,
      input.whatsappNumber ?? input.phone ?? null,
      input.location ?? null,
      input.linkedinUrl ?? null,
      input.telegramUsername ?? null,
      input.telegramChatId ?? null,
      input.portfolioUrl ?? null,
      input.githubUrl ?? null,
      input.resumeUrl ?? null,
      input.resumeStoragePath ?? null,
      input.onboardingCompleted ?? existing.onboardingCompleted,
    ],
  );

  return mapUserRow(updated.rows[0]);
}

export async function getUserJobPreferences(userId: number) {
  const result = await pool.query(`SELECT * FROM user_job_preferences WHERE user_id = $1`, [userId]);
  return result.rows[0] ? mapPreferencesRow(result.rows[0]) : null;
}

export async function saveUserJobPreferences(
  userId: number,
  input: Omit<UserJobPreferencesRecord, "userId" | "createdAt" | "updatedAt">,
) {
  const result = await pool.query(
    `INSERT INTO user_job_preferences (
       user_id, preferred_roles, preferred_locations, remote_preference, referral_preference,
       instant_apply_enabled, blocked_companies, target_applications_per_day, notification_channels
     )
     VALUES ($1,$2::jsonb,$3::jsonb,$4,$5,$6,$7::jsonb,$8,$9::jsonb)
     ON CONFLICT (user_id)
     DO UPDATE SET
       preferred_roles = EXCLUDED.preferred_roles,
       preferred_locations = EXCLUDED.preferred_locations,
       remote_preference = EXCLUDED.remote_preference,
       referral_preference = EXCLUDED.referral_preference,
       instant_apply_enabled = EXCLUDED.instant_apply_enabled,
       blocked_companies = EXCLUDED.blocked_companies,
       target_applications_per_day = EXCLUDED.target_applications_per_day,
       notification_channels = EXCLUDED.notification_channels,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      JSON.stringify(input.preferredRoles),
      JSON.stringify(input.preferredLocations),
      input.remotePreference,
      input.referralPreference,
      input.instantApplyEnabled,
      JSON.stringify(input.blockedCompanies),
      input.targetApplicationsPerDay,
      JSON.stringify(input.notificationChannels),
    ],
  );

  return mapPreferencesRow(result.rows[0]);
}

export async function listConnectedAccounts(userId: number) {
  const result = await pool.query(
    `SELECT * FROM connected_accounts WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  return result.rows.map(mapConnectedAccountRow);
}

export async function createConnectedAccount(
  userId: number,
  input: Omit<ConnectedAccountRecord, "id" | "userId" | "lastCheckedAt" | "createdAt" | "updatedAt">,
) {
  const result = await pool.query(
    `INSERT INTO connected_accounts (
       user_id, provider, account_label, connection_status, approval_mode, account_identifier, metadata, last_checked_at
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW())
     RETURNING *`,
    [
      userId,
      input.provider,
      input.accountLabel,
      input.connectionStatus,
      input.approvalMode,
      input.accountIdentifier ?? null,
      JSON.stringify(input.metadata),
    ],
  );

  return mapConnectedAccountRow(result.rows[0]);
}

export async function listJobFeedWatchers(userId: number) {
  const result = await pool.query(
    `SELECT * FROM job_feed_watchers WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  return result.rows.map(mapWatcherRow);
}

export async function listActiveJobFeedWatchers() {
  const result = await pool.query(
    `SELECT * FROM job_feed_watchers WHERE status = 'active' ORDER BY id ASC`,
  );
  return result.rows.map(mapWatcherRow);
}

export async function createJobFeedWatcher(
  userId: number,
  input: Omit<
    JobFeedWatcherRecord,
    "id" | "userId" | "lastRunAt" | "lastSuccessAt" | "lastError" | "createdAt" | "updatedAt"
  >,
) {
  const result = await pool.query(
    `INSERT INTO job_feed_watchers (
       user_id, name, source_platform, provider, status, polling_interval_seconds,
       search_titles, locations, recency_days, configuration
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10::jsonb)
     RETURNING *`,
    [
      userId,
      input.name,
      input.sourcePlatform,
      input.provider,
      input.status,
      input.pollingIntervalSeconds,
      JSON.stringify(input.searchTitles),
      JSON.stringify(input.locations),
      input.recencyDays,
      JSON.stringify(input.configuration),
    ],
  );

  return mapWatcherRow(result.rows[0]);
}

export async function updateJobFeedWatcherStatus(
  watcherId: number,
  input: { status: JobFeedWatcherRecord["status"]; lastError?: string },
) {
  const result = await pool.query(
    `UPDATE job_feed_watchers
     SET status = $2,
         last_error = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [watcherId, input.status, input.lastError ?? null],
  );
  return result.rows[0] ? mapWatcherRow(result.rows[0]) : null;
}

export async function markJobFeedWatcherRun(
  watcherId: number,
  input: { status: JobFeedWatcherRecord["status"]; lastError?: string; succeeded: boolean },
) {
  const result = await pool.query(
    `UPDATE job_feed_watchers
     SET status = $2,
         last_run_at = NOW(),
         last_success_at = CASE WHEN $4 THEN NOW() ELSE last_success_at END,
         last_error = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [watcherId, input.status, input.lastError ?? null, input.succeeded],
  );
  return result.rows[0] ? mapWatcherRow(result.rows[0]) : null;
}

export async function getJobFeedCursor(watcherId: number) {
  const result = await pool.query(
    `SELECT * FROM job_feed_cursors WHERE watcher_id = $1`,
    [watcherId],
  );
  return result.rows[0] ? mapJobFeedCursorRow(result.rows[0]) : null;
}

export async function saveJobFeedCursor(
  watcherId: number,
  input: { lastSeenJobId?: string | null; lastSeenTimestamp?: string | null },
) {
  const result = await pool.query(
    `INSERT INTO job_feed_cursors (watcher_id, last_seen_job_id, last_seen_timestamp)
     VALUES ($1, $2, $3)
     ON CONFLICT (watcher_id)
     DO UPDATE SET
       last_seen_job_id = EXCLUDED.last_seen_job_id,
       last_seen_timestamp = EXCLUDED.last_seen_timestamp,
       updated_at = NOW()
     RETURNING *`,
    [watcherId, input.lastSeenJobId ?? null, input.lastSeenTimestamp ?? null],
  );
  return mapJobFeedCursorRow(result.rows[0]);
}

export async function listJobDiscoveryEventsByWatcherId(watcherId: number) {
  const result = await pool.query(
    `SELECT *
     FROM job_discovery_events
     WHERE watcher_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 100`,
    [watcherId],
  );
  return result.rows.map(mapJobDiscoveryEventRow);
}

export async function listWatcherActivitiesByUserId(userId: number): Promise<JobWatcherActivityRecord[]> {
  const result = await pool.query<{
    watcher_id: string;
    watcher_name: string;
    source_platform: string;
    provider: string;
    status: string;
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
       watchers.name AS watcher_name,
       watchers.source_platform,
       watchers.provider,
       watchers.status,
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
     WHERE watchers.user_id = $1
     GROUP BY watchers.id, cursors.watcher_id
     ORDER BY watchers.updated_at DESC, watchers.id DESC`,
    [userId],
  );

  return result.rows.map((row) => ({
    watcherId: Number(row.watcher_id),
    watcherName: row.watcher_name,
    sourcePlatform: row.source_platform as JobWatcherActivityRecord["sourcePlatform"],
    provider: row.provider as JobWatcherActivityRecord["provider"],
    status: row.status as JobWatcherActivityRecord["status"],
    pollingIntervalSeconds: Number(row.polling_interval_seconds),
    lastRunAt: row.last_run_at ? new Date(row.last_run_at).toISOString() : null,
    lastSuccessAt: row.last_success_at ? new Date(row.last_success_at).toISOString() : null,
    lastError: row.last_error,
    lastSeenTimestamp: row.last_seen_timestamp ? new Date(row.last_seen_timestamp).toISOString() : null,
    recentDiscoveryCount: Number(row.recent_discovery_count),
    recentFreshCount: Number(row.recent_fresh_count),
  }));
}

export async function listRecentJobDiscoveryEventsByUserId(
  userId: number,
  input: { limit: number; eventType?: JobDiscoveryEventRecord["eventType"] },
): Promise<RecentJobDiscoveryEventRecord[]> {
  const values: Array<number | string> = [userId];
  let eventTypeClause = "";

  if (input.eventType) {
    values.push(input.eventType);
    eventTypeClause = `AND discovery.event_type = $${values.length}`;
  }

  values.push(input.limit);

  const result = await pool.query<{
    id: string;
    watcher_id: string | null;
    watcher_name: string;
    source_platform: string;
    provider: string;
    job_id: string | null;
    event_type: string;
    payload: Record<string, unknown> | null;
    company: string | null;
    title: string | null;
    created_at: string;
  }>(
    `SELECT
       discovery.id,
       discovery.watcher_id,
       watchers.name AS watcher_name,
       watchers.source_platform,
       watchers.provider,
       discovery.job_id,
       discovery.event_type,
       discovery.payload,
       jobs.company,
       jobs.title,
       discovery.created_at
     FROM job_discovery_events AS discovery
     INNER JOIN job_feed_watchers AS watchers
       ON watchers.id = discovery.watcher_id
     LEFT JOIN jobs
       ON jobs.id = discovery.job_id
     WHERE watchers.user_id = $1
       ${eventTypeClause}
     ORDER BY discovery.created_at DESC, discovery.id DESC
     LIMIT $${values.length}`,
    values,
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    watcherId: row.watcher_id == null ? null : Number(row.watcher_id),
    watcherName: row.watcher_name,
    sourcePlatform: row.source_platform as RecentJobDiscoveryEventRecord["sourcePlatform"],
    provider: row.provider as RecentJobDiscoveryEventRecord["provider"],
    jobId: row.job_id == null ? null : Number(row.job_id),
    eventType: row.event_type as RecentJobDiscoveryEventRecord["eventType"],
    payload: row.payload ?? {},
    company: row.company,
    title: row.title,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function createJobDiscoveryEvent(input: {
  watcherId: number;
  jobId?: number | null;
  eventType: JobDiscoveryEventRecord["eventType"];
  payload?: Record<string, unknown>;
}) {
  const result = await pool.query(
    `INSERT INTO job_discovery_events (watcher_id, job_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING *`,
    [input.watcherId, input.jobId ?? null, input.eventType, JSON.stringify(input.payload ?? {})],
  );
  return mapJobDiscoveryEventRow(result.rows[0]);
}
