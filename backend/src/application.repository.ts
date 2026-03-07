import { pool } from "./db.js";
import type { UpsertApplicationInput } from "./application.schema.js";
import type { ApplicationRateWindowSnapshot, ApplicationRecord } from "./application.types.js";

function mapApplicationRow(row: Record<string, unknown>): ApplicationRecord {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    company: String(row.company),
    title: String(row.title),
    location: String(row.location),
    sourcePlatform: String(row.source_platform) as ApplicationRecord["sourcePlatform"],
    applied: Boolean(row.applied),
    appliedDate: row.applied_date ? new Date(String(row.applied_date)).toISOString() : null,
    status: String(row.status) as ApplicationRecord["status"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const applicationSelect = `SELECT
  applications.id,
  applications.job_id,
  jobs.company,
  jobs.title,
  jobs.location,
  applications.source_platform,
  applications.applied,
  applications.applied_date,
  applications.status,
  applications.created_at,
  applications.updated_at
FROM applications
INNER JOIN jobs ON jobs.id = applications.job_id`;

export async function listApplications(): Promise<ApplicationRecord[]> {
  const result = await pool.query(
    `${applicationSelect}
     ORDER BY applications.updated_at DESC, applications.id DESC`,
  );

  return result.rows.map(mapApplicationRow);
}

export async function findApplicationByJobId(jobId: number): Promise<ApplicationRecord | null> {
  const result = await pool.query(`${applicationSelect} WHERE applications.job_id = $1`, [jobId]);
  return result.rows[0] ? mapApplicationRow(result.rows[0]) : null;
}

export async function upsertApplication(input: UpsertApplicationInput): Promise<ApplicationRecord> {
  const effectiveAppliedDate =
    input.appliedDate ?? (input.applied ? new Date().toISOString() : null);

  const result = await pool.query(
    `INSERT INTO applications (
       job_id,
       source_platform,
       applied,
       applied_date,
       status
     )
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (job_id)
     DO UPDATE SET
       source_platform = EXCLUDED.source_platform,
       applied = EXCLUDED.applied,
       applied_date = EXCLUDED.applied_date,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING id`,
    [input.jobId, input.sourcePlatform, input.applied, effectiveAppliedDate, input.status],
  );

  const applicationId = Number(result.rows[0]?.id);
  const record = await pool.query(`${applicationSelect} WHERE applications.id = $1`, [applicationId]);

  return mapApplicationRow(record.rows[0]);
}

export async function getApplicationRateWindowSnapshot(windowHours: number): Promise<ApplicationRateWindowSnapshot> {
  const result = await pool.query<{ applied_count: string; oldest_applied_at: string | null }>(
    `SELECT
       COUNT(*)::text AS applied_count,
       MIN(applied_date)::text AS oldest_applied_at
     FROM applications
     WHERE applied = TRUE
       AND applied_date IS NOT NULL
       AND applied_date >= NOW() - ($1::text || ' hours')::interval`,
    [windowHours],
  );

  const row = result.rows[0];

  return {
    appliedCount: Number(row.applied_count),
    oldestAppliedAt: row.oldest_applied_at ? new Date(row.oldest_applied_at).toISOString() : null,
  };
}
