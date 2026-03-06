import { pool } from "./db.js";
import type { UpsertProfileFieldInput } from "./profile.schema.js";
import type { ProfileFieldRecord } from "./profile.types.js";

function mapRow(row: Record<string, unknown>): ProfileFieldRecord {
  return {
    key: String(row.key),
    label: String(row.label),
    value: String(row.value),
    valueType: String(row.value_type),
    source: row.source as ProfileFieldRecord["source"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listProfileFields(): Promise<ProfileFieldRecord[]> {
  const result = await pool.query(
    `SELECT key, label, value, value_type, source, created_at, updated_at
     FROM profile_fields
     ORDER BY label ASC, key ASC`,
  );

  return result.rows.map(mapRow);
}

export async function upsertProfileField(
  key: string,
  input: UpsertProfileFieldInput,
): Promise<ProfileFieldRecord> {
  const result = await pool.query(
    `INSERT INTO profile_fields (key, label, value, source)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (key)
     DO UPDATE SET
       label = EXCLUDED.label,
       value = EXCLUDED.value,
       source = EXCLUDED.source
     RETURNING key, label, value, value_type, source, created_at, updated_at`,
    [key, input.label, input.value, input.source],
  );

  return mapRow(result.rows[0]);
}

export async function deleteProfileField(key: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM profile_fields WHERE key = $1", [key]);

  return (result.rowCount ?? 0) > 0;
}
