import { z } from "zod";

export const fieldMappingConfidenceSchema = z.enum(["manual", "learned", "suggested"]);

export const upsertFieldMappingSchema = z.object({
  rawLabel: z.string().trim().min(1).max(200),
  profileKey: z.string().trim().min(1).max(64).regex(/^[a-z0-9_]+$/),
  confidence: fieldMappingConfidenceSchema.default("manual"),
});

export type UpsertFieldMappingInput = z.infer<typeof upsertFieldMappingSchema>;

