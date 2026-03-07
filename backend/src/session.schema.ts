import { z } from "zod";

export const applicationSessionStatusSchema = z.enum(["paused", "ready_to_resume", "completed"]);
export const applicationSessionIdSchema = z.coerce.number().int().positive();

export const upsertApplicationSessionSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  formUrl: z.string().trim().url(),
  filledFields: z.record(z.string(), z.string()).default({}),
  missingField: z.string().trim().min(1).max(160),
  status: applicationSessionStatusSchema.default("paused"),
});

export type UpsertApplicationSessionInput = z.infer<typeof upsertApplicationSessionSchema>;

export const resumeApplicationSessionSchema = z.object({
  resumePath: z.string().trim().min(1).optional(),
});

export type ResumeApplicationSessionInput = z.infer<typeof resumeApplicationSessionSchema>;
