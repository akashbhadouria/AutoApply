import { pool } from "./db.js";
import type { UpsertReferralInput } from "./referral.schema.js";
import type { ReferralRecord } from "./referral.types.js";

function mapReferralRow(row: Record<string, unknown>): ReferralRecord {
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    contactId: Number(row.contact_id),
    company: String(row.company),
    jobTitle: String(row.job_title),
    contactName: String(row.contact_name),
    contactRole: String(row.contact_role),
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

export async function listReferralsByJobId(jobId: number): Promise<ReferralRecord[]> {
  const result = await pool.query(
    `${referralSelect}
     WHERE referrals.job_id = $1
     ORDER BY referrals.updated_at DESC, referrals.id DESC`,
    [jobId],
  );

  return result.rows.map(mapReferralRow);
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
