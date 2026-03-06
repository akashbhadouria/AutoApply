import { Worker } from "bullmq";

import type {
  ApplicationQueueJobData,
  BrowserAutomationJobData,
  JobDiscoveryJobData,
  NotificationJobData,
  ReferralJobData,
} from "./contracts.js";
import { getConnectionOptions } from "./connection.js";
import { queueNames } from "./contracts.js";

function logWorkerStart(name: string, data: unknown) {
  console.log(`[worker:${name}] received`, JSON.stringify(data));
}

export function startWorkers() {
  const connection = getConnectionOptions();

  const jobScannerWorker = new Worker<JobDiscoveryJobData>(
    queueNames.jobScanner,
    async (job) => {
      logWorkerStart(queueNames.jobScanner, job.data);
    },
    { connection },
  );

  const referralEngineWorker = new Worker<ReferralJobData>(
    queueNames.referralEngine,
    async (job) => {
      logWorkerStart(queueNames.referralEngine, job.data);
    },
    { connection },
  );

  const applicationQueueWorker = new Worker<ApplicationQueueJobData>(
    queueNames.applicationQueue,
    async (job) => {
      logWorkerStart(queueNames.applicationQueue, job.data);
    },
    { connection },
  );

  const browserAutomationWorker = new Worker<BrowserAutomationJobData>(
    queueNames.browserAutomation,
    async (job) => {
      logWorkerStart(queueNames.browserAutomation, job.data);
    },
    { connection },
  );

  const notificationWorker = new Worker<NotificationJobData>(
    queueNames.notifications,
    async (job) => {
      logWorkerStart(queueNames.notifications, job.data);
    },
    { connection },
  );

  return {
    async close() {
      await Promise.all([
        jobScannerWorker.close(),
        referralEngineWorker.close(),
        applicationQueueWorker.close(),
        browserAutomationWorker.close(),
        notificationWorker.close(),
      ]);
    },
  };
}
