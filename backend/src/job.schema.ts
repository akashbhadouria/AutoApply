import { z } from "zod";

export const sourcePlatformSchema = z.enum(["linkedin", "instahyre", "hirist", "naukri", "company_site"]);

export const discoverJobSchema = z.object({
  company: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160),
  jobUrl: z.string().trim().url(),
  sourcePlatform: sourcePlatformSchema,
  postedDate: z.string().date().optional(),
  firstSeenAt: z.string().datetime().optional(),
  freshnessStatus: z.enum(["fresh", "recent", "standard"]).optional(),
  jobPriority: z.enum(["high", "normal", "low"]).optional(),
  applyStrategy: z.enum(["api", "http_form", "browser"]).optional(),
  discoveredByWatcherId: z.coerce.number().int().positive().optional(),
});

export type DiscoverJobInput = z.infer<typeof discoverJobSchema>;

export const discoverJobsBatchSchema = z.object({
  jobs: z.array(discoverJobSchema).min(1).max(100),
});

export type DiscoverJobsBatchInput = z.infer<typeof discoverJobsBatchSchema>;
