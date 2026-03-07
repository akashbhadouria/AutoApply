import { pool } from "./db.js";
import type { SaveApplyAttemptInput } from "./apply-attempt.schema.js";
import type { ApplyAttemptRecord } from "./apply-attempt.types.js";

function mapApplyAttemptRow(row: Record<string, unknown>): ApplyAttemptRecord {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    strategy: String(row.strategy) as ApplyAttemptRecord["strategy"],
    provider: String(row.provider),
    status: String(row.status) as ApplyAttemptRecord["status"],
    externalReference: row.external_reference ? String(row.external_reference) : null,
    requestPayload:
      row.request_payload && typeof row.request_payload === "object"
        ? (row.request_payload as Record<string, unknown>)
        : {},
    responseSummary:
      row.response_summary && typeof row.response_summary === "object"
        ? (row.response_summary as Record<string, unknown>)
        : {},
    durationMs: row.duration_ms == null ? null : Number(row.duration_ms),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createApplyAttempt(input: SaveApplyAttemptInput): Promise<ApplyAttemptRecord> {
  const result = await pool.query(
    `INSERT INTO apply_attempts (
       job_id,
       strategy,
       provider,
       status,
       external_reference,
       request_payload,
       response_summary,
       duration_ms
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.jobId,
      input.strategy,
      input.provider,
      input.status,
      input.externalReference ?? null,
      JSON.stringify(input.requestPayload ?? {}),
      JSON.stringify(input.responseSummary ?? {}),
      input.durationMs ?? null,
    ],
  );

  return mapApplyAttemptRow(result.rows[0]);
}

export async function listApplyAttemptsByJobId(jobId: number): Promise<ApplyAttemptRecord[]> {
  const result = await pool.query(
    `SELECT *
     FROM apply_attempts
     WHERE job_id = $1
     ORDER BY created_at DESC, id DESC`,
    [jobId],
  );

  return result.rows.map(mapApplyAttemptRow);
}
