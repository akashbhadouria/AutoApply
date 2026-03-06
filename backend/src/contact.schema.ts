import { z } from "zod";

import { sourcePlatformSchema } from "./job.schema.js";

export const upsertContactSchema = z.object({
  company: z.string().trim().min(1).max(160),
  fullName: z.string().trim().min(1).max(160),
  firstName: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  profileUrl: z.string().trim().url().optional(),
  email: z.string().trim().email().optional(),
  sourcePlatform: sourcePlatformSchema.default("linkedin"),
});

export type UpsertContactInput = z.infer<typeof upsertContactSchema>;

