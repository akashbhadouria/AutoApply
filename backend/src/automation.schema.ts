import { z } from "zod";

export const automationQueueNameSchema = z.enum([
  "job-scanner",
  "referral-engine",
  "application-queue",
  "browser-automation",
  "notifications",
]);

export const enqueueAutomationJobSchema = z.object({
  queueName: automationQueueNameSchema,
  payload: z.record(z.string(), z.unknown()),
});

export type EnqueueAutomationJobInput = z.infer<typeof enqueueAutomationJobSchema>;

