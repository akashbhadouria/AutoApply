import type { ConnectionOptions } from "bullmq";

import { env } from "./config.js";

export function getConnectionOptions(): ConnectionOptions {
  return {
    url: env.redisUrl,
  };
}

