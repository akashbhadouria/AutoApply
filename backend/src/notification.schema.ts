import { z } from "zod";

export const notificationChannelSchema = z.enum(["dashboard", "email", "telegram", "whatsapp"]);
export const notificationStatusSchema = z.enum(["pending", "delivered", "failed"]);

export const createNotificationSchema = z.object({
  type: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  channel: notificationChannelSchema.default("dashboard"),
  status: notificationStatusSchema.default("pending"),
  relatedJobId: z.coerce.number().int().positive().optional(),
  relatedReferralId: z.coerce.number().int().positive().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const updateNotificationStatusSchema = z.object({
  status: notificationStatusSchema,
  deliveredAt: z.string().datetime().optional(),
});

export type UpdateNotificationStatusInput = z.infer<typeof updateNotificationStatusSchema>;
