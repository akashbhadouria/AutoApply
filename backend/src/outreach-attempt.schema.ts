import { z } from "zod";

const outreachChannelSchema = z.enum(["linkedin", "email", "telegram", "whatsapp"]);
const approvalStatusSchema = z.enum(["pending_approval", "approved", "rejected", "not_required"]);
const executionStatusSchema = z.enum(["drafted", "queued", "sent", "failed", "cancelled"]);

export const saveOutreachAttemptSchema = z.object({
  referralId: z.coerce.number().int().positive(),
  connectedAccountId: z.coerce.number().int().positive().optional(),
  channel: outreachChannelSchema,
  approvalStatus: approvalStatusSchema.default("pending_approval"),
  executionStatus: executionStatusSchema.default("drafted"),
  messageSubject: z.string().trim().min(1).max(255).optional(),
  messageBody: z.string().trim().min(1).max(8000),
  externalReference: z.string().trim().min(1).max(255).optional(),
  errorMessage: z.string().trim().min(1).max(1000).optional(),
  approvedAt: z.string().datetime().optional(),
  sentAt: z.string().datetime().optional(),
});

export const updateOutreachAttemptApprovalSchema = z.object({
  approvalStatus: z.enum(["approved", "rejected", "not_required"]),
  approvedAt: z.string().datetime().optional(),
});

export const updateOutreachAttemptStatusSchema = z.object({
  executionStatus: executionStatusSchema,
  externalReference: z.string().trim().min(1).max(255).optional(),
  errorMessage: z.string().trim().min(1).max(1000).optional(),
  sentAt: z.string().datetime().optional(),
});

export const listOutreachAttemptsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  approvalStatus: approvalStatusSchema.optional(),
  executionStatus: executionStatusSchema.optional(),
  channel: outreachChannelSchema.optional(),
});

export type SaveOutreachAttemptInput = z.infer<typeof saveOutreachAttemptSchema>;
export type UpdateOutreachAttemptApprovalInput = z.infer<typeof updateOutreachAttemptApprovalSchema>;
export type UpdateOutreachAttemptStatusInput = z.infer<typeof updateOutreachAttemptStatusSchema>;
export type ListOutreachAttemptsQuery = z.infer<typeof listOutreachAttemptsQuerySchema>;
