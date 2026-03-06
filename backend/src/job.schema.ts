import { z } from "zod";

export const sourcePlatformSchema = z.enum(["linkedin", "instahyre", "hirist", "naukri", "company_site"]);

export const discoverJobSchema = z.object({
  company: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160),
  jobUrl: z.string().trim().url(),
  sourcePlatform: sourcePlatformSchema,
  postedDate: z.string().date().optional(),
});

export type DiscoverJobInput = z.infer<typeof discoverJobSchema>;

