import { z } from "zod";

const optionalUrlSchema = z.string().trim().url().optional();

export const referralDraftSchema = z.object({
  company: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160).optional(),
  contactFirstName: z.string().trim().min(1).max(80),
  contactTitle: z.string().trim().min(1).max(160).optional(),
  userName: z.string().trim().min(1).max(120),
  resumeLink: optionalUrlSchema,
  portfolioLink: optionalUrlSchema,
  yearsOfExperience: z.string().trim().min(1).max(40).optional(),
  primarySkills: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
});

export type ReferralDraftInput = z.infer<typeof referralDraftSchema>;

export const fieldMappingSuggestionSchema = z.object({
  rawLabel: z.string().trim().min(1).max(200),
  company: z.string().trim().min(1).max(160).optional(),
  jobTitle: z.string().trim().min(1).max(160).optional(),
  existingProfileKeys: z.array(z.string().trim().min(1).max(64)).max(100),
});

export type FieldMappingSuggestionInput = z.infer<typeof fieldMappingSuggestionSchema>;

export const jobSummarySchema = z.object({
  company: z.string().trim().min(1).max(160),
  jobTitle: z.string().trim().min(1).max(160),
  jobDescription: z.string().trim().min(1).max(12000),
});

export type JobSummaryInput = z.infer<typeof jobSummarySchema>;

export const notificationSummarySchema = z.object({
  type: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
  channel: z.enum(["dashboard", "email", "telegram", "whatsapp"]),
});

export type NotificationSummaryInput = z.infer<typeof notificationSummarySchema>;
