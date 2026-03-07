import { z } from "zod";

import { listApplyAttemptsQuerySchema, saveApplyAttemptSchema } from "./apply-attempt.schema.js";
import { createApplyAttempt, listApplyAttempts, listApplyAttemptsByJobId } from "./apply-attempt.repository.js";

export async function saveApplyAttempt(payload: unknown) {
  const input = saveApplyAttemptSchema.parse(payload);
  return createApplyAttempt(input);
}

export async function getApplyAttemptsByJobId(jobId: string) {
  const normalizedJobId = z.coerce.number().int().positive().parse(jobId);
  return listApplyAttemptsByJobId(normalizedJobId);
}

export async function getApplyAttempts(payload: unknown) {
  const input = listApplyAttemptsQuerySchema.parse(payload);
  return listApplyAttempts(input);
}
