import type { JobsOptions } from "bullmq";
import { Queue } from "bullmq";

import { getConnectionOptions } from "./connection.js";
import { queueNames, type ApplicationQueueJobData, type JobFeedWatcherJobData, type NotificationJobData } from "./contracts.js";

const connection = getConnectionOptions();

const queueRetryPolicies = {
  [queueNames.jobFeedWatcher]: { attempts: 2, backoffDelayMs: 10_000, removeOnComplete: 100, removeOnFail: 50 },
  [queueNames.jobScanner]: { attempts: 2, backoffDelayMs: 10_000, removeOnComplete: 100, removeOnFail: 50 },
  [queueNames.referralEngine]: { attempts: 3, backoffDelayMs: 15_000, removeOnComplete: 100, removeOnFail: 50 },
  [queueNames.applicationQueue]: { attempts: 4, backoffDelayMs: 30_000, removeOnComplete: 200, removeOnFail: 100 },
  [queueNames.browserAutomation]: { attempts: 4, backoffDelayMs: 45_000, removeOnComplete: 200, removeOnFail: 100 },
  [queueNames.notifications]: { attempts: 3, backoffDelayMs: 20_000, removeOnComplete: 150, removeOnFail: 75 },
} as const;

function createQueue(queueName: keyof typeof queueRetryPolicies) {
  const retryPolicy = queueRetryPolicies[queueName];
  return new Queue(queueName, {
    connection,
    defaultJobOptions: {
      attempts: retryPolicy.attempts,
      backoff: {
        type: "fixed",
        delay: retryPolicy.backoffDelayMs,
      },
      removeOnComplete: retryPolicy.removeOnComplete,
      removeOnFail: retryPolicy.removeOnFail,
    },
  });
}

function getQueueJobOptions(queueName: keyof typeof queueRetryPolicies, overrides?: Partial<JobsOptions>): JobsOptions {
  const retryPolicy = queueRetryPolicies[queueName];
  return {
    attempts: retryPolicy.attempts,
    backoff: {
      type: "fixed",
      delay: retryPolicy.backoffDelayMs,
    },
    removeOnComplete: retryPolicy.removeOnComplete,
    removeOnFail: retryPolicy.removeOnFail,
    ...overrides,
  };
}

export const jobScannerQueue = createQueue(queueNames.jobScanner);
export const jobFeedWatcherQueue = createQueue(queueNames.jobFeedWatcher);
export const referralEngineQueue = createQueue(queueNames.referralEngine);
export const applicationQueue = createQueue(queueNames.applicationQueue);
export const browserAutomationQueue = createQueue(queueNames.browserAutomation);
export const notificationsQueue = createQueue(queueNames.notifications);

export async function enqueueApplicationQueueJob(data: ApplicationQueueJobData, overrides?: Partial<JobsOptions>) {
  return applicationQueue.add(queueNames.applicationQueue, data, getQueueJobOptions(queueNames.applicationQueue, overrides));
}

export async function enqueueJobFeedWatcherJob(data: JobFeedWatcherJobData, overrides?: Partial<JobsOptions>) {
  return jobFeedWatcherQueue.add(queueNames.jobFeedWatcher, data, getQueueJobOptions(queueNames.jobFeedWatcher, overrides));
}

export async function enqueueReferralEngineJob(
  data: {
    mode?: "drafts" | "timeouts";
    jobId?: number;
    olderThanHours?: number;
  },
  overrides?: Partial<JobsOptions>,
) {
  return referralEngineQueue.add(queueNames.referralEngine, data, getQueueJobOptions(queueNames.referralEngine, overrides));
}

export async function enqueueBrowserAutomationJob(
  data: {
    jobId: number;
    formUrl: string;
    resumePath?: string;
    sourcePlatform?: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  },
  overrides?: Partial<JobsOptions>,
) {
  return browserAutomationQueue.add(
    queueNames.browserAutomation,
    data,
    getQueueJobOptions(queueNames.browserAutomation, overrides),
  );
}

export async function enqueueNotificationJob(data: NotificationJobData, overrides?: Partial<JobsOptions>) {
  return notificationsQueue.add(queueNames.notifications, data, getQueueJobOptions(queueNames.notifications, overrides));
}

export async function closeQueues() {
  await Promise.all([
    jobFeedWatcherQueue.close(),
    jobScannerQueue.close(),
    referralEngineQueue.close(),
    applicationQueue.close(),
    browserAutomationQueue.close(),
    notificationsQueue.close(),
  ]);
}
