import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGIN: z.string().url(),
  PORT: z.coerce.number().int().positive().default(4000),
});

export const env = envSchema.parse(process.env);

