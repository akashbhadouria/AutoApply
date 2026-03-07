import { pool } from "./db.js";
import type { UpdateReferralStatusInput, UpsertReferralInput } from "./referral.schema.js";
import type { ReferralRecord, TimedOutReferralRecord } from "./referral.types.js";

function mapReferralRow(row: Record<string, unknown>): ReferralRecord {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    contactId: Number(row.contact_id),
    company: String(row.company),
    jobTitle: String(row.job_title),
    contactName: String(row.contact_name),
    contactRole: String(row.contact_role),
    jobSourcePlatform: row.job_source_platform
      ? (String(row.job_source_platform) as ReferralRecord["jobSourcePlatform"])
      : undefined,
    status: String(row.status) as ReferralRecord["status"],
    outreachMessage: String(row.outreach_message),
    connectionRequestMessage: row.connection_request_message ? String(row.connection_request_message) : null,
    messageSentAt: row.message_sent_at ? new Date(String(row.message_sent_at)).toISOString() : null,
    repliedAt: row.replied_at ? new Date(String(row.replied_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const referralSelect = `SELECT
  referrals.id,
  referrals.job_id,
  referrals.contact_id,
  jobs.company,
  jobs.title AS job_title,
  jobs.primary_source_platform AS job_source_platform,
  contacts.full_name AS contact_name,
  contacts.title AS contact_role,
  referrals.status,
  referrals.outreach_message,
  referrals.connection_request_message,
  referrals.message_sent_at,
  referrals.replied_at,
  referrals.created_at,
  referrals.updated_at
FROM referrals
INNER JOIN jobs ON jobs.id = referrals.job_id
INNER JOIN contacts ON contacts.id = referrals.contact_id`;

export async function listReferrals(): Promise<ReferralRecord[]> {
  const result = await pool.query(
    `${referralSelect}
     ORDER BY referrals.updated_at DESC, referrals.id DESC`,
  );

  return result.rows.map(mapReferralRow);
}

export async function listPendingReferrals(): Promise<ReferralRecord[]> {
  const result = await pool.query(
    `${referralSelect}
     WHERE referrals.status = 'pending'
     ORDER BY referrals.updated_at DESC, referrals.id DESC`,
  );

  return result.rows.map(mapReferralRow);
}

export async function listReferralsByJobId(jobId: number): Promise<ReferralRecord[]> {
  const result = await pool.query(
    `${referralSelect}
     WHERE referrals.job_id = $1
     ORDER BY referrals.updated_at DESC, referrals.id DESC`,
    [jobId],
  );

  return result.rows.map(mapReferralRow);
}

export async function listTimedOutPendingReferrals(olderThanHours: number): Promise<TimedOutReferralRecord[]> {
  const result = await pool.query(
    `${referralSelect}
     WHERE referrals.status = 'pending'
       AND referrals.message_sent_at IS NOT NULL
       AND referrals.message_sent_at <= NOW() - ($1::text || ' hours')::interval
     ORDER BY referrals.message_sent_at ASC, referrals.id ASC`,
    [olderThanHours],
  );

  return result.rows.map((row) => mapReferralRow(row) as TimedOutReferralRecord);
}

export async function upsertReferral(input: UpsertReferralInput): Promise<ReferralRecord> {
  const result = await pool.query(
    `INSERT INTO referrals (
       job_id,
       contact_id,
       status,
       outreach_message,
       connection_request_message,
       message_sent_at,
       replied_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (job_id, contact_id)
     DO UPDATE SET
       status = EXCLUDED.status,
       outreach_message = EXCLUDED.outreach_message,
       connection_request_message = EXCLUDED.connection_request_message,
       message_sent_at = EXCLUDED.message_sent_at,
       replied_at = EXCLUDED.replied_at,
       updated_at = NOW()
     RETURNING id`,
    [
      input.jobId,
      input.contactId,
      input.status,
      input.outreachMessage,
      input.connectionRequestMessage ?? null,
      input.messageSentAt ?? null,
      input.repliedAt ?? null,
    ],
  );

  const referralId = Number(result.rows[0]?.id);
  const record = await pool.query(`${referralSelect} WHERE referrals.id = $1`, [referralId]);
  return mapReferralRow(record.rows[0]);
}

export async function updateReferralStatus(
  referralId: number,
  input: UpdateReferralStatusInput,
): Promise<ReferralRecord | null> {
  const result = await pool.query(
    `UPDATE referrals
     SET
       status = $2,
       replied_at = COALESCE($3, replied_at),
       updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [referralId, input.status, input.repliedAt ?? null],
  );

  if (!result.rows[0]) {
    return null;
  }

  const record = await pool.query(`${referralSelect} WHERE referrals.id = $1`, [referralId]);
  return mapReferralRow(record.rows[0]);
}
