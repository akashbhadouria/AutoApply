import { z } from "zod";

export const platformSchema = z.enum(["linkedin", "naukri", "instahyre", "hirist"]);

const capturedCookieSchema = z.object({
  name: z.string().trim().min(1),
  value: z.string(),
  domain: z.string().trim().min(1),
  path: z.string().trim().min(1).optional(),
  httpOnly: z.boolean().optional(),
  secure: z.boolean().optional(),
  sameSite: z.enum(["Strict", "Lax", "None"]).optional(),
  expirationDate: z.number().optional(),
});

export const capturePlatformSessionSchema = z.object({
  platform: platformSchema,
  accountIdentifier: z.string().trim().min(1).max(240).optional(),
  userAgent: z.string().trim().min(1).max(500).optional(),
  cookies: z.array(capturedCookieSchema).min(1),
  localStorage: z.record(z.string(), z.string()).optional(),
  sessionStorage: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
