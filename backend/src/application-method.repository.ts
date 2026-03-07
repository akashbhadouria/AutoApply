import { pool } from "./db.js";
import type { ApplicationMethodRecord } from "./application-method.types.js";

function mapApplicationMethodRow(row: Record<string, unknown>): ApplicationMethodRecord {
  return {
    id: Number(row.id),
    provider: String(row.provider),
    sourcePlatform: String(row.source_platform) as ApplicationMethodRecord["sourcePlatform"],
    supportsApiApply: Boolean(row.supports_api_apply),
    supportsHttpFormApply: Boolean(row.supports_http_form_apply),
    requiresBrowser: Boolean(row.requires_browser),
    priorityRank: Number(row.priority_rank),
    notes: row.notes ? String(row.notes) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listApplicationMethods(): Promise<ApplicationMethodRecord[]> {
  const result = await pool.query(
    `SELECT *
     FROM application_methods
     ORDER BY priority_rank ASC, provider ASC`,
  );

  return result.rows.map(mapApplicationMethodRow);
}
