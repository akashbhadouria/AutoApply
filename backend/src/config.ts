import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  SESSION_ENCRYPTION_KEY: z.string().min(16).default("dev-autoapply-session-key"),
});

export const env = envSchema.parse(process.env);
