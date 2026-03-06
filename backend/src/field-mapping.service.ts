import { listFieldMappings, upsertFieldMapping } from "./field-mapping.repository.js";
import { upsertFieldMappingSchema } from "./field-mapping.schema.js";

export async function getFieldMappings() {
  return listFieldMappings();
}

export async function saveFieldMapping(payload: unknown) {
  const input = upsertFieldMappingSchema.parse(payload);
  return upsertFieldMapping(input);
}

