import { z } from "zod";

import {
  listOutreachAttemptsQuerySchema,
  saveOutreachAttemptSchema,
  updateOutreachAttemptApprovalSchema,
  updateOutreachAttemptStatusSchema,
} from "./outreach-attempt.schema.js";
import {
  createOutreachAttempt,
  listOutreachAttempts,
  listOutreachAttemptsByReferralId,
  updateOutreachAttemptApproval,
  updateOutreachAttemptStatus,
} from "./outreach-attempt.repository.js";

export async function saveOutreachAttempt(payload: unknown) {
  const input = saveOutreachAttemptSchema.parse(payload);
  return createOutreachAttempt(input);
}

export async function getOutreachAttempts(payload: unknown) {
  const input = listOutreachAttemptsQuerySchema.parse(payload);
  return listOutreachAttempts(input);
}

export async function getOutreachAttemptsByReferralId(referralId: string) {
  const normalizedReferralId = z.coerce.number().int().positive().parse(referralId);
  return listOutreachAttemptsByReferralId(normalizedReferralId);
}

export async function changeOutreachAttemptApproval(outreachAttemptId: string, payload: unknown) {
  const normalizedOutreachAttemptId = z.coerce.number().int().positive().parse(outreachAttemptId);
  const input = updateOutreachAttemptApprovalSchema.parse(payload);
  return updateOutreachAttemptApproval(normalizedOutreachAttemptId, input);
}

export async function changeOutreachAttemptStatus(outreachAttemptId: string, payload: unknown) {
  const normalizedOutreachAttemptId = z.coerce.number().int().positive().parse(outreachAttemptId);
  const input = updateOutreachAttemptStatusSchema.parse(payload);
  return updateOutreachAttemptStatus(normalizedOutreachAttemptId, input);
}
