import { z } from "zod";

export const createEventSchema = z.object({
  eventType: z.string().trim().min(1).max(120),
  actor: z.string().trim().min(1).max(120),
  payload: z.record(z.string(), z.unknown()).default({}),
  relatedJobId: z.coerce.number().int().positive().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

