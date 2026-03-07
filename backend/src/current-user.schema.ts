import { z } from "zod";

const providerSchema = z.enum(["linkedin", "gmail", "outlook", "telegram", "whatsapp"]);
const channelSchema = z.enum(["dashboard", "email", "telegram", "whatsapp"]);
const sourcePlatformSchema = z.enum(["linkedin", "instahyre", "hirist", "naukri", "company_site"]);
const watcherProviderSchema = z.enum([
  "linkedin",
  "instahyre",
  "hirist",
  "naukri",
  "company_site",
  "greenhouse",
  "lever",
  "generic_json",
  "google_jobs",
]);

export const currentUserSchema = z.object({
  email: z.string().trim().email(),
  notificationEmail: z.string().trim().email().optional(),
  fullName: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(1).max(40).optional(),
  whatsappNumber: z.string().trim().min(1).max(40).optional(),
  location: z.string().trim().min(1).max(160).optional(),
  linkedinUrl: z.string().trim().url().optional(),
  telegramUsername: z.string().trim().min(1).max(80).optional(),
  telegramChatId: z.string().trim().min(1).max(80).optional(),
  portfolioUrl: z.string().trim().url().optional(),
  githubUrl: z.string().trim().url().optional(),
  resumeUrl: z.string().trim().url().optional(),
  resumeStoragePath: z.string().trim().min(1).max(240).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const userJobPreferencesSchema = z.object({
  preferredRoles: z.array(z.string().trim().min(1).max(160)).max(20),
  preferredLocations: z.array(z.string().trim().min(1).max(160)).max(20),
  remotePreference: z.enum(["remote_only", "hybrid", "onsite_only", "any"]),
  referralPreference: z.enum(["referral_first", "instant_apply", "balanced"]),
  instantApplyEnabled: z.boolean(),
  blockedCompanies: z.array(z.string().trim().min(1).max(160)).max(50),
  targetApplicationsPerDay: z.coerce.number().int().positive().max(500),
  notificationChannels: z.array(channelSchema).min(1).max(4),
});

export const connectedAccountSchema = z.object({
  provider: providerSchema,
  accountLabel: z.string().trim().min(1).max(120),
  connectionStatus: z.enum(["pending", "connected", "degraded", "disconnected"]).default("pending"),
  approvalMode: z.enum(["manual_approval", "auto_send"]).default("manual_approval"),
  accountIdentifier: z.string().trim().min(1).max(160).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const jobFeedWatcherSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sourcePlatform: sourcePlatformSchema,
  provider: watcherProviderSchema,
  status: z.enum(["active", "paused", "error"]).default("active"),
  pollingIntervalSeconds: z.coerce.number().int().min(30).max(3600).default(60),
  searchTitles: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
  locations: z.array(z.string().trim().min(1).max(160)).min(1).max(20),
  recencyDays: z.coerce.number().int().min(1).max(30).default(7),
  configuration: z.record(z.string(), z.unknown()).optional(),
});

export const jobFeedWatcherStatusSchema = z.object({
  status: z.enum(["active", "paused", "error"]),
  lastError: z.string().trim().min(1).max(500).optional(),
});
