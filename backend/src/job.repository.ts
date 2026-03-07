import { pool } from "./db.js";
import type { DiscoverJobInput } from "./job.schema.js";
import type { JobRecord } from "./job.types.js";

function mapJobRow(row: Record<string, unknown>): JobRecord {
  return {
    id: Number(row.id),
    company: String(row.company),
    title: String(row.title),
    location: String(row.location),
    jobUrl: String(row.job_url),
    primarySourcePlatform: String(row.primary_source_platform) as JobRecord["primarySourcePlatform"],
    sourcePlatforms: Array.isArray(row.source_platforms)
      ? row.source_platforms.map((platform) => String(platform) as JobRecord["sourcePlatforms"][number])
      : [],
    postedDate: row.posted_date ? new Date(String(row.posted_date)).toISOString().slice(0, 10) : null,
    firstSeenAt: new Date(String(row.first_seen_at)).toISOString(),
    freshnessStatus: String(row.freshness_status) as JobRecord["freshnessStatus"],
    jobPriority: String(row.job_priority) as JobRecord["jobPriority"],
    applyStrategy: String(row.apply_strategy) as JobRecord["applyStrategy"],
    discoveredByWatcherId: row.discovered_by_watcher_id ? Number(row.discovered_by_watcher_id) : null,
    discoveredAt: new Date(String(row.discovered_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function normalizeIdentityPart(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function listJobs(): Promise<JobRecord[]> {
  const result = await pool.query(
    `SELECT
       jobs.id,
       jobs.company,
       jobs.title,
       jobs.location,
       jobs.job_url,
       jobs.primary_source_platform,
       jobs.posted_date,
       jobs.first_seen_at,
       jobs.freshness_status,
       jobs.job_priority,
       jobs.apply_strategy,
       jobs.discovered_by_watcher_id,
       jobs.discovered_at,
       jobs.updated_at,
       ARRAY_REMOVE(ARRAY_AGG(job_sources.source_platform ORDER BY job_sources.source_platform), NULL) AS source_platforms
     FROM jobs
     LEFT JOIN job_sources ON job_sources.job_id = jobs.id
     GROUP BY jobs.id
     ORDER BY jobs.discovered_at DESC, jobs.id DESC`,
  );

  return result.rows.map(mapJobRow);
}

export async function discoverJob(input: DiscoverJobInput): Promise<JobRecord> {
  const normalizedCompany = normalizeIdentityPart(input.company);
  const normalizedTitle = normalizeIdentityPart(input.title);
  const normalizedLocation = normalizeIdentityPart(input.location);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const jobResult = await client.query(
      `INSERT INTO jobs (
         company,
         title,
         location,
         job_url,
         primary_source_platform,
         posted_date,
         first_seen_at,
         freshness_status,
         job_priority,
         apply_strategy,
         discovered_by_watcher_id,
         normalized_company,
         normalized_title,
         normalized_location
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (normalized_company, normalized_title, normalized_location)
       DO UPDATE SET
         company = EXCLUDED.company,
         title = EXCLUDED.title,
         location = EXCLUDED.location,
         job_url = EXCLUDED.job_url,
         posted_date = COALESCE(EXCLUDED.posted_date, jobs.posted_date),
         first_seen_at = LEAST(jobs.first_seen_at, EXCLUDED.first_seen_at),
         freshness_status = CASE
           WHEN EXCLUDED.freshness_status = 'fresh' THEN 'fresh'
           WHEN EXCLUDED.freshness_status = 'recent' AND jobs.freshness_status = 'standard' THEN 'recent'
           ELSE jobs.freshness_status
         END,
         job_priority = CASE
           WHEN EXCLUDED.job_priority = 'high' THEN 'high'
           WHEN EXCLUDED.job_priority = 'normal' AND jobs.job_priority = 'low' THEN 'normal'
           ELSE jobs.job_priority
         END,
         apply_strategy = EXCLUDED.apply_strategy,
         discovered_by_watcher_id = COALESCE(EXCLUDED.discovered_by_watcher_id, jobs.discovered_by_watcher_id),
         updated_at = NOW()
       RETURNING id`,
      [
        input.company,
        input.title,
        input.location,
        input.jobUrl,
        input.sourcePlatform,
        input.postedDate ?? null,
        input.firstSeenAt ?? new Date().toISOString(),
        input.freshnessStatus ?? "standard",
        input.jobPriority ?? "normal",
        input.applyStrategy ?? "browser",
        input.discoveredByWatcherId ?? null,
        normalizedCompany,
        normalizedTitle,
        normalizedLocation,
      ],
    );

    const jobId = Number(jobResult.rows[0]?.id);

    await client.query(
      `INSERT INTO job_sources (job_id, source_platform, job_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (job_id, source_platform)
       DO UPDATE SET
         job_url = EXCLUDED.job_url,
         discovered_at = NOW()`,
      [jobId, input.sourcePlatform, input.jobUrl],
    );

    const mergedResult = await client.query(
      `SELECT
         jobs.id,
         jobs.company,
         jobs.title,
         jobs.location,
         jobs.job_url,
         jobs.primary_source_platform,
         jobs.posted_date,
         jobs.first_seen_at,
         jobs.freshness_status,
         jobs.job_priority,
         jobs.apply_strategy,
         jobs.discovered_by_watcher_id,
         jobs.discovered_at,
         jobs.updated_at,
         ARRAY_REMOVE(ARRAY_AGG(job_sources.source_platform ORDER BY job_sources.source_platform), NULL) AS source_platforms
       FROM jobs
       LEFT JOIN job_sources ON job_sources.job_id = jobs.id
       WHERE jobs.id = $1
       GROUP BY jobs.id`,
      [jobId],
    );

    await client.query("COMMIT");
    return mapJobRow(mergedResult.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
