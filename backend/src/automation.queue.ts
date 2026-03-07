import type { ConnectionOptions, JobsOptions } from "bullmq";
import { Queue } from "bullmq";

import { env } from "./config.js";
import type { AutomationQueueName, AutomationQueueRetryPolicy } from "./automation.types.js";

export const automationQueueNames = {
  jobFeedWatcher: "job-feed-watcher",
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

export const queueRetryPolicies: Record<AutomationQueueName, AutomationQueueRetryPolicy> = {
  "job-feed-watcher": {
    attempts: 2,
    backoffType: "fixed",
    backoffDelayMs: 10_000,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "job-scanner": {
    attempts: 2,
    backoffType: "fixed",
    backoffDelayMs: 10_000,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "referral-engine": {
    attempts: 3,
    backoffType: "fixed",
    backoffDelayMs: 15_000,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  "application-queue": {
    attempts: 4,
    backoffType: "fixed",
    backoffDelayMs: 30_000,
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  "browser-automation": {
    attempts: 4,
    backoffType: "fixed",
    backoffDelayMs: 45_000,
    removeOnComplete: 200,
    removeOnFail: 100,
  },
  notifications: {
    attempts: 3,
    backoffType: "fixed",
    backoffDelayMs: 20_000,
    removeOnComplete: 150,
    removeOnFail: 75,
  },
};

function createQueue(queueName: AutomationQueueName) {
  const retryPolicy = queueRetryPolicies[queueName];
  return new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: retryPolicy.attempts,
      backoff: {
        type: retryPolicy.backoffType,
        delay: retryPolicy.backoffDelayMs,
      },
      removeOnComplete: retryPolicy.removeOnComplete,
      removeOnFail: retryPolicy.removeOnFail,
    },
  });
}

export function getQueueJobOptions(queueName: AutomationQueueName, overrides?: Partial<JobsOptions>): JobsOptions {
  const retryPolicy = queueRetryPolicies[queueName];
  return {
    attempts: retryPolicy.attempts,
    backoff: {
      type: retryPolicy.backoffType,
      delay: retryPolicy.backoffDelayMs,
    },
    removeOnComplete: retryPolicy.removeOnComplete,
    removeOnFail: retryPolicy.removeOnFail,
    ...overrides,
  };
}

export const queueRegistry = {
  [automationQueueNames.jobFeedWatcher]: createQueue(automationQueueNames.jobFeedWatcher),
  [automationQueueNames.jobScanner]: createQueue(automationQueueNames.jobScanner),
  [automationQueueNames.referralEngine]: createQueue(automationQueueNames.referralEngine),
  [automationQueueNames.applicationQueue]: createQueue(automationQueueNames.applicationQueue),
  [automationQueueNames.browserAutomation]: createQueue(automationQueueNames.browserAutomation),
  [automationQueueNames.notifications]: createQueue(automationQueueNames.notifications),
};
