import { upsertReferralSchema } from "./referral.schema.js";
import { listReferrals, upsertReferral } from "./referral.repository.js";

export async function getReferrals() {
  return listReferrals();
}

export async function saveReferral(payload: unknown) {
  const input = upsertReferralSchema.parse(payload);
  return upsertReferral(input);
}

