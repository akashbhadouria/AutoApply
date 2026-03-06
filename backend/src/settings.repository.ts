import { pool } from "./db.js";
import type { UpsertSystemSettingInput } from "./settings.schema.js";
import type { SystemSettingRecord } from "./settings.types.js";

function mapSettingRow(row: Record<string, unknown>): SystemSettingRecord {
  return {
    key: String(row.key),
    label: String(row.label),
    value: String(row.value),
    valueType: String(row.value_type) as SystemSettingRecord["valueType"],
    category: String(row.category),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listSystemSettings(): Promise<SystemSettingRecord[]> {
  const result = await pool.query(
    `SELECT key, label, value, value_type, category, created_at, updated_at
     FROM system_settings
     ORDER BY category ASC, label ASC, key ASC`,
  );

  return result.rows.map(mapSettingRow);
}

export async function upsertSystemSetting(
  key: string,
  input: UpsertSystemSettingInput,
): Promise<SystemSettingRecord> {
  const result = await pool.query(
    `INSERT INTO system_settings (key, label, value, value_type, category)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (key)
     DO UPDATE SET
       label = EXCLUDED.label,
       value = EXCLUDED.value,
       value_type = EXCLUDED.value_type,
       category = EXCLUDED.category,
       updated_at = NOW()
     RETURNING key, label, value, value_type, category, created_at, updated_at`,
    [key, input.label, input.value, input.valueType, input.category],
  );

  return mapSettingRow(result.rows[0]);
}

export async function deleteSystemSetting(key: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM system_settings WHERE key = $1`, [key]);
  return (result.rowCount ?? 0) > 0;
}
