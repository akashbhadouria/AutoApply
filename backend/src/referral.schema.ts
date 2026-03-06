import { z } from "zod";

export const referralStatusSchema = z.enum(["pending", "replied", "referred", "no_response"]);

export const upsertReferralSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  contactId: z.coerce.number().int().positive(),
  status: referralStatusSchema.default("pending"),
  outreachMessage: z.string().trim().min(1).max(4000),
  connectionRequestMessage: z.string().trim().max(1000).optional(),
  messageSentAt: z.string().datetime().optional(),
  repliedAt: z.string().datetime().optional(),
});

export type UpsertReferralInput = z.infer<typeof upsertReferralSchema>;

