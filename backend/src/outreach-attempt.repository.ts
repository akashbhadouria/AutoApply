import { pool } from "./db.js";
import type {
  ListOutreachAttemptsQuery,
  SaveOutreachAttemptInput,
  UpdateOutreachAttemptApprovalInput,
  UpdateOutreachAttemptStatusInput,
} from "./outreach-attempt.schema.js";
import type { OutreachAttemptListRecord, OutreachAttemptRecord } from "./outreach-attempt.types.js";

function mapOutreachAttemptRow(row: Record<string, unknown>): OutreachAttemptRecord {
  return {
    id: Number(row.id),
    referralId: Number(row.referral_id),
    connectedAccountId: row.connected_account_id == null ? null : Number(row.connected_account_id),
    channel: String(row.channel) as OutreachAttemptRecord["channel"],
    approvalStatus: String(row.approval_status) as OutreachAttemptRecord["approvalStatus"],
    executionStatus: String(row.execution_status) as OutreachAttemptRecord["executionStatus"],
    messageSubject: row.message_subject ? String(row.message_subject) : null,
    messageBody: String(row.message_body),
    externalReference: row.external_reference ? String(row.external_reference) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    requestedAt: new Date(String(row.requested_at)).toISOString(),
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : null,
    sentAt: row.sent_at ? new Date(String(row.sent_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

const outreachAttemptSelect = `SELECT
  outreach_attempts.*,
  jobs.company,
  jobs.title AS job_title,
  contacts.full_name AS contact_name,
  contacts.title AS contact_role,
  connected_accounts.account_label AS connected_account_label,
  connected_accounts.provider AS connected_account_provider
FROM outreach_attempts
INNER JOIN referrals ON referrals.id = outreach_attempts.referral_id
INNER JOIN jobs ON jobs.id = referrals.job_id
INNER JOIN contacts ON contacts.id = referrals.contact_id
LEFT JOIN connected_accounts ON connected_accounts.id = outreach_attempts.connected_account_id`;

function mapOutreachAttemptListRow(row: Record<string, unknown>): OutreachAttemptListRecord {
  return {
    ...mapOutreachAttemptRow(row),
    company: String(row.company),
    jobTitle: String(row.job_title),
    contactName: String(row.contact_name),
    contactRole: String(row.contact_role),
    connectedAccountLabel: row.connected_account_label ? String(row.connected_account_label) : null,
    connectedAccountProvider: row.connected_account_provider
      ? (String(row.connected_account_provider) as OutreachAttemptListRecord["connectedAccountProvider"])
      : null,
  };
}

export async function createOutreachAttempt(input: SaveOutreachAttemptInput): Promise<OutreachAttemptListRecord> {
  const result = await pool.query(
    `INSERT INTO outreach_attempts (
       referral_id,
       connected_account_id,
       channel,
       approval_status,
       execution_status,
       message_subject,
       message_body,
       external_reference,
       error_message,
       approved_at,
       sent_at
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id`,
    [
      input.referralId,
      input.connectedAccountId ?? null,
      input.channel,
      input.approvalStatus,
      input.executionStatus,
      input.messageSubject ?? null,
      input.messageBody,
      input.externalReference ?? null,
      input.errorMessage ?? null,
      input.approvedAt ?? null,
      input.sentAt ?? null,
    ],
  );

  const attemptId = Number(result.rows[0]?.id);
  const record = await pool.query(`${outreachAttemptSelect} WHERE outreach_attempts.id = $1`, [attemptId]);
  return mapOutreachAttemptListRow(record.rows[0]);
}

export async function listOutreachAttempts(input: ListOutreachAttemptsQuery): Promise<OutreachAttemptListRecord[]> {
  const values: Array<number | string> = [];
  const conditions: string[] = [];

  if (input.approvalStatus) {
    values.push(input.approvalStatus);
    conditions.push(`outreach_attempts.approval_status = $${values.length}`);
  }

  if (input.executionStatus) {
    values.push(input.executionStatus);
    conditions.push(`outreach_attempts.execution_status = $${values.length}`);
  }

  if (input.channel) {
    values.push(input.channel);
    conditions.push(`outreach_attempts.channel = $${values.length}`);
  }

  values.push(input.limit);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `${outreachAttemptSelect}
     ${whereClause}
     ORDER BY outreach_attempts.updated_at DESC, outreach_attempts.id DESC
     LIMIT $${values.length}`,
    values,
  );

  return result.rows.map(mapOutreachAttemptListRow);
}

export async function listOutreachAttemptsByReferralId(referralId: number): Promise<OutreachAttemptListRecord[]> {
  const result = await pool.query(
    `${outreachAttemptSelect}
     WHERE outreach_attempts.referral_id = $1
     ORDER BY outreach_attempts.updated_at DESC, outreach_attempts.id DESC`,
    [referralId],
  );

  return result.rows.map(mapOutreachAttemptListRow);
}

export async function updateOutreachAttemptApproval(
  outreachAttemptId: number,
  input: UpdateOutreachAttemptApprovalInput,
): Promise<OutreachAttemptListRecord | null> {
  const result = await pool.query(
    `UPDATE outreach_attempts
     SET approval_status = $2,
         approved_at = CASE
           WHEN $2 = 'approved' OR $2 = 'not_required' THEN COALESCE($3, NOW())
           ELSE NULL
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [outreachAttemptId, input.approvalStatus, input.approvedAt ?? null],
  );

  if (!result.rows[0]) {
    return null;
  }

  const record = await pool.query(`${outreachAttemptSelect} WHERE outreach_attempts.id = $1`, [outreachAttemptId]);
  return mapOutreachAttemptListRow(record.rows[0]);
}

export async function updateOutreachAttemptStatus(
  outreachAttemptId: number,
  input: UpdateOutreachAttemptStatusInput,
): Promise<OutreachAttemptListRecord | null> {
  const result = await pool.query(
    `UPDATE outreach_attempts
     SET execution_status = $2,
         external_reference = COALESCE($3, external_reference),
         error_message = $4,
         sent_at = CASE
           WHEN $2 = 'sent' THEN COALESCE($5, NOW())
           ELSE sent_at
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [outreachAttemptId, input.executionStatus, input.externalReference ?? null, input.errorMessage ?? null, input.sentAt ?? null],
  );

  if (!result.rows[0]) {
    return null;
  }

  const record = await pool.query(`${outreachAttemptSelect} WHERE outreach_attempts.id = $1`, [outreachAttemptId]);
  return mapOutreachAttemptListRow(record.rows[0]);
}
