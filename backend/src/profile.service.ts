import { deleteProfileField, listProfileFields, upsertProfileField } from "./profile.repository.js";
import { profileFieldKeySchema, upsertProfileFieldSchema } from "./profile.schema.js";

export async function getProfileFields() {
  return listProfileFields();
}

export async function saveProfileField(key: string, payload: unknown) {
  const normalizedKey = profileFieldKeySchema.parse(key);
  const input = upsertProfileFieldSchema.parse(payload);

  return upsertProfileField(normalizedKey, input);
}

export async function removeProfileField(key: string) {
  const normalizedKey = profileFieldKeySchema.parse(key);

  return deleteProfileField(normalizedKey);
}

