import { config as loadEnv } from "dotenv";

loadEnv();

export const env = {
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
};
