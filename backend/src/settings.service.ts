import { deleteSystemSetting, listSystemSettings, upsertSystemSetting } from "./settings.repository.js";
import { systemSettingKeySchema, upsertSystemSettingSchema } from "./settings.schema.js";

export async function getSystemSettings() {
  return listSystemSettings();
}

export async function saveSystemSetting(key: string, payload: unknown) {
  const normalizedKey = systemSettingKeySchema.parse(key);
  const input = upsertSystemSettingSchema.parse(payload);
  return upsertSystemSetting(normalizedKey, input);
}

export async function removeSystemSetting(key: string) {
  const normalizedKey = systemSettingKeySchema.parse(key);
  return deleteSystemSetting(normalizedKey);
}
