import { z } from "zod";

import { saveApplyAttemptSchema } from "./apply-attempt.schema.js";
import { createApplyAttempt, listApplyAttemptsByJobId } from "./apply-attempt.repository.js";

export async function saveApplyAttempt(payload: unknown) {
  const input = saveApplyAttemptSchema.parse(payload);
  return createApplyAttempt(input);
}

export async function getApplyAttemptsByJobId(jobId: string) {
  const normalizedJobId = z.coerce.number().int().positive().parse(jobId);
  return listApplyAttemptsByJobId(normalizedJobId);
}
