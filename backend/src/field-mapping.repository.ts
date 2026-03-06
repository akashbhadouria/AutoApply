import { pool } from "./db.js";
import type { UpsertFieldMappingInput } from "./field-mapping.schema.js";
import type { FieldMappingRecord } from "./field-mapping.types.js";

function normalizeLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapFieldMappingRow(row: Record<string, unknown>): FieldMappingRecord {
  return {
    id: Number(row.id),
    rawLabel: String(row.raw_label),
    normalizedLabel: String(row.normalized_label),
    profileKey: String(row.profile_key),
    confidence: String(row.confidence) as FieldMappingRecord["confidence"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function listFieldMappings(): Promise<FieldMappingRecord[]> {
  const result = await pool.query(
    `SELECT id, raw_label, normalized_label, profile_key, confidence, created_at, updated_at
     FROM field_mappings
     ORDER BY updated_at DESC, id DESC`,
  );

  return result.rows.map(mapFieldMappingRow);
}

export async function upsertFieldMapping(input: UpsertFieldMappingInput): Promise<FieldMappingRecord> {
  const result = await pool.query(
    `INSERT INTO field_mappings (raw_label, normalized_label, profile_key, confidence)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (raw_label)
     DO UPDATE SET
       normalized_label = EXCLUDED.normalized_label,
       profile_key = EXCLUDED.profile_key,
       confidence = EXCLUDED.confidence,
       updated_at = NOW()
     RETURNING id, raw_label, normalized_label, profile_key, confidence, created_at, updated_at`,
    [input.rawLabel, normalizeLabel(input.rawLabel), input.profileKey, input.confidence],
  );

  return mapFieldMappingRow(result.rows[0]);
}

