import { updateReferralStatusSchema, upsertReferralSchema } from "./referral.schema.js";
import { listReferrals, listReferralsByJobId, listTimedOutPendingReferrals, updateReferralStatus, upsertReferral } from "./referral.repository.js";
import { z } from "zod";

export async function getReferrals() {
  return listReferrals();
}

export async function getReferralsForJob(jobId: string) {
  const normalizedJobId = z.coerce.number().int().positive().parse(jobId);
  return listReferralsByJobId(normalizedJobId);
}

export async function saveReferral(payload: unknown) {
  const input = upsertReferralSchema.parse(payload);
  return upsertReferral(input);
}

export async function getTimedOutPendingReferrals(olderThanHours?: string) {
  const normalizedHours = olderThanHours ? z.coerce.number().int().positive().parse(olderThanHours) : 24;
  return listTimedOutPendingReferrals(normalizedHours);
}

export async function changeReferralStatus(referralId: string, payload: unknown) {
  const normalizedReferralId = z.coerce.number().int().positive().parse(referralId);
  const input = updateReferralStatusSchema.parse(payload);
  return updateReferralStatus(normalizedReferralId, input);
}
