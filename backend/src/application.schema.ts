import { z } from "zod";

import { sourcePlatformSchema } from "./job.schema.js";

export const applicationStatusSchema = z.enum(["pending", "applied", "interview", "rejected", "offer"]);

export const upsertApplicationSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  sourcePlatform: sourcePlatformSchema,
  applied: z.boolean().default(false),
  appliedDate: z.string().datetime().optional(),
  status: applicationStatusSchema.default("pending"),
});

export type UpsertApplicationInput = z.infer<typeof upsertApplicationSchema>;

