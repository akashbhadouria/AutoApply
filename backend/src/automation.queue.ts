import type { ConnectionOptions } from "bullmq";
import { Queue } from "bullmq";

import { env } from "./config.js";

export const automationQueueNames = {
  jobScanner: "job-scanner",
  referralEngine: "referral-engine",
  applicationQueue: "application-queue",
  browserAutomation: "browser-automation",
  notifications: "notifications",
} as const;

function getConnectionOptions(): ConnectionOptions {
  return {
    url: env.REDIS_URL,
  };
}

const connection = getConnectionOptions();

export const queueRegistry = {
  [automationQueueNames.jobScanner]: new Queue(automationQueueNames.jobScanner, { connection }),
  [automationQueueNames.referralEngine]: new Queue(automationQueueNames.referralEngine, { connection }),
  [automationQueueNames.applicationQueue]: new Queue(automationQueueNames.applicationQueue, { connection }),
  [automationQueueNames.browserAutomation]: new Queue(automationQueueNames.browserAutomation, { connection }),
  [automationQueueNames.notifications]: new Queue(automationQueueNames.notifications, { connection }),
};

