import { pool } from "./db.js";
import type { CreateNotificationInput } from "./notification.schema.js";
import type { NotificationRecord } from "./notification.types.js";

function mapNotificationRow(row: Record<string, unknown>): NotificationRecord {
  return {
    id: Number(row.id),
    type: String(row.type),
    title: String(row.title),
    message: String(row.message),
    channel: String(row.channel) as NotificationRecord["channel"],
    status: String(row.status) as NotificationRecord["status"],
    relatedJobId: row.related_job_id ? Number(row.related_job_id) : null,
    relatedReferralId: row.related_referral_id ? Number(row.related_referral_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    deliveredAt: row.delivered_at ? new Date(String(row.delivered_at)).toISOString() : null,
  };
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  const result = await pool.query(
    `SELECT
       id,
       type,
       title,
       message,
       channel,
       status,
       related_job_id,
       related_referral_id,
       created_at,
       delivered_at
     FROM notifications
     ORDER BY created_at DESC, id DESC`,
  );

  return result.rows.map(mapNotificationRow);
}

export async function createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
  const result = await pool.query(
    `INSERT INTO notifications (
       type,
       title,
       message,
       channel,
       status,
       related_job_id,
       related_referral_id,
       delivered_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING
       id,
       type,
       title,
       message,
       channel,
       status,
       related_job_id,
       related_referral_id,
       created_at,
       delivered_at`,
    [
      input.type,
      input.title,
      input.message,
      input.channel,
      input.status,
      input.relatedJobId ?? null,
      input.relatedReferralId ?? null,
      input.deliveredAt ?? null,
    ],
  );

  return mapNotificationRow(result.rows[0]);
}

