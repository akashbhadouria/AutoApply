import { z } from "zod";

export const profileFieldKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_]+$/);

export const upsertProfileFieldSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(1000),
  source: z.enum(["manual", "learned", "imported"]).default("manual"),
});

export type UpsertProfileFieldInput = z.infer<typeof upsertProfileFieldSchema>;

