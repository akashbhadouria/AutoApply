import { z } from "zod";

export const saveApplyAttemptSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  strategy: z.enum(["api", "http_form", "browser"]),
  provider: z.string().trim().min(1).max(120),
  status: z.enum(["queued", "submitted", "failed", "unsupported"]),
  externalReference: z.string().trim().min(1).max(255).optional(),
  requestPayload: z.record(z.string(), z.unknown()).optional(),
  responseSummary: z.record(z.string(), z.unknown()).optional(),
  durationMs: z.coerce.number().int().nonnegative().optional(),
});

export type SaveApplyAttemptInput = z.infer<typeof saveApplyAttemptSchema>;
