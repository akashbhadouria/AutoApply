import { pool } from "./db.js";
import type { CreateEventInput } from "./event.schema.js";
import type { EventRecord } from "./event.types.js";

function mapEventRow(row: Record<string, unknown>): EventRecord {
  return {
    id: Number(row.id),
    eventType: String(row.event_type),
    actor: String(row.actor),
    payload: (row.payload as Record<string, unknown>) ?? {},
    relatedJobId: row.related_job_id ? Number(row.related_job_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function listEvents(): Promise<EventRecord[]> {
  const result = await pool.query(
    `SELECT id, event_type, actor, payload, related_job_id, created_at
     FROM events
     ORDER BY created_at DESC, id DESC`,
  );

  return result.rows.map(mapEventRow);
}

export async function createEvent(input: CreateEventInput): Promise<EventRecord> {
  const result = await pool.query(
    `INSERT INTO events (event_type, actor, payload, related_job_id)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, event_type, actor, payload, related_job_id, created_at`,
    [input.eventType, input.actor, JSON.stringify(input.payload), input.relatedJobId ?? null],
  );

  return mapEventRow(result.rows[0]);
}

