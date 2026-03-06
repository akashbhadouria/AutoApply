import { pool } from "./db.js";
import type { UpsertApplicationInput } from "./application.schema.js";
import type { ApplicationRecord } from "./application.types.js";

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

