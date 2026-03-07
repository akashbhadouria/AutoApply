import { pool } from "./db.js";
import type { UpsertApplicationSessionInput } from "./session.schema.js";
import type { ApplicationSessionRecord } from "./session.types.js";

function mapSessionRow(row: Record<string, unknown>): ApplicationSessionRecord {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    company: String(row.company),
    title: String(row.title),
    formUrl: String(row.form_url),
    filledFields: (row.filled_fields as Record<string, string>) ?? {},
    missingField: String(row.missing_field),
    status: String(row.status) as ApplicationSessionRecord["status"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const sessionSelect = `SELECT
  application_sessions.id,
  application_sessions.job_id,
  jobs.company,
  jobs.title,
  application_sessions.form_url,
  application_sessions.filled_fields,
  application_sessions.missing_field,
  application_sessions.status,
  application_sessions.created_at,
  application_sessions.updated_at
FROM application_sessions
INNER JOIN jobs ON jobs.id = application_sessions.job_id`;

export async function listApplicationSessions(): Promise<ApplicationSessionRecord[]> {
  const result = await pool.query(
    `${sessionSelect}
     ORDER BY application_sessions.updated_at DESC, application_sessions.id DESC`,
  );

  return result.rows.map(mapSessionRow);
}

export async function getApplicationSessionById(sessionId: number): Promise<ApplicationSessionRecord | null> {
  const result = await pool.query(`${sessionSelect} WHERE application_sessions.id = $1`, [sessionId]);
  const row = result.rows[0];
  return row ? mapSessionRow(row) : null;
}

export async function upsertApplicationSession(input: UpsertApplicationSessionInput): Promise<ApplicationSessionRecord> {
  const result = await pool.query(
    `INSERT INTO application_sessions (
       job_id,
       form_url,
       filled_fields,
       missing_field,
       status
     )
     VALUES ($1, $2, $3::jsonb, $4, $5)
     ON CONFLICT (job_id, form_url, missing_field)
     DO UPDATE SET
       filled_fields = EXCLUDED.filled_fields,
       status = EXCLUDED.status,
       updated_at = NOW()
     RETURNING id`,
    [input.jobId, input.formUrl, JSON.stringify(input.filledFields), input.missingField, input.status],
  );

  const sessionId = Number(result.rows[0]?.id);
  const record = await pool.query(`${sessionSelect} WHERE application_sessions.id = $1`, [sessionId]);
  return mapSessionRow(record.rows[0]);
}

export async function updateApplicationSessionStatus(
  sessionId: number,
  status: ApplicationSessionRecord["status"],
): Promise<ApplicationSessionRecord | null> {
  const result = await pool.query(
    `UPDATE application_sessions
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [sessionId, status],
  );

  const updatedId = result.rows[0]?.id;
  if (!updatedId) {
    return null;
  }

  const record = await pool.query(`${sessionSelect} WHERE application_sessions.id = $1`, [Number(updatedId)]);
  return mapSessionRow(record.rows[0]);
}
