import { config as loadEnv } from "dotenv";

loadEnv();

export const env = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
};

