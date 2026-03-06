import { z } from "zod";

export const systemSettingKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/);

export const settingValueTypeSchema = z.enum(["string", "boolean", "number", "json"]);

export const upsertSystemSettingSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(4000),
  valueType: settingValueTypeSchema.default("string"),
  category: z.string().trim().min(1).max(80).default("general"),
});

export type UpsertSystemSettingInput = z.infer<typeof upsertSystemSettingSchema>;
