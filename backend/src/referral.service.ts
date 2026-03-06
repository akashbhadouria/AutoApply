import { upsertReferralSchema } from "./referral.schema.js";
import { listReferrals, listReferralsByJobId, upsertReferral } from "./referral.repository.js";
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
