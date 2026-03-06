import { Worker } from "bullmq";

import {
  createBackendApplicationSession,
  createBackendEvent,
  createBackendNotification,
  updateBackendNotificationStatus,
} from "./backend.js";
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
      await createBackendEvent({
        eventType: "job_scanner.run_requested",
        actor: "jobScannerWorker",
        payload: {
          searchTitles: job.data.searchTitles,
          locations: job.data.locations,
          recencyDays: job.data.recencyDays,
        },
      });
      await createBackendNotification({
        type: "job_scanner_requested",
        title: "Job scanner run requested",
        message: `Requested discovery for ${job.data.searchTitles.length} titles across ${job.data.locations.length} locations.`,
        channel: "dashboard",
        status: "pending",
      });
    },
    { connection },
  );

  const referralEngineWorker = new Worker<ReferralJobData>(
    queueNames.referralEngine,
    async (job) => {
      logWorkerStart(queueNames.referralEngine, job.data);
      await createBackendEvent({
        eventType: "referral_engine.run_requested",
        actor: "referralEngineWorker",
        payload: { queue: queueNames.referralEngine, jobId: job.data.jobId },
        relatedJobId: job.data.jobId,
      });
      await createBackendNotification({
        type: "referral_draft_ready",
        title: "Referral run queued",
        message: `Referral generation was queued for job ${job.data.jobId}.`,
        channel: "dashboard",
        status: "pending",
        relatedJobId: job.data.jobId,
      });
    },
    { connection },
  );

  const applicationQueueWorker = new Worker<ApplicationQueueJobData>(
    queueNames.applicationQueue,
    async (job) => {
      logWorkerStart(queueNames.applicationQueue, job.data);
      await createBackendEvent({
        eventType: "application_queue.run_requested",
        actor: "applicationQueueWorker",
        payload: {
          jobId: job.data.jobId,
          sourcePlatform: job.data.sourcePlatform,
        },
        relatedJobId: job.data.jobId,
      });
      await createBackendNotification({
        type: "application_queue_requested",
        title: "Application queue run requested",
        message: `Application processing was requested for job ${job.data.jobId} from ${job.data.sourcePlatform}.`,
        channel: "dashboard",
        status: "pending",
        relatedJobId: job.data.jobId,
      });
    },
    { connection },
  );

  const browserAutomationWorker = new Worker<BrowserAutomationJobData>(
    queueNames.browserAutomation,
    async (job) => {
      logWorkerStart(queueNames.browserAutomation, job.data);
      await createBackendApplicationSession({
        jobId: job.data.jobId,
        formUrl: job.data.formUrl,
        filledFields: {},
        missingField: "resume_path",
        status: "paused",
      });
      await createBackendEvent({
        eventType: "browser_automation.session_paused",
        actor: "browserAutomationWorker",
        payload: {
          jobId: job.data.jobId,
          formUrl: job.data.formUrl,
          resumePath: job.data.resumePath ?? null,
        },
        relatedJobId: job.data.jobId,
      });
    },
    { connection },
  );

  const notificationWorker = new Worker<NotificationJobData>(
    queueNames.notifications,
    async (job) => {
      logWorkerStart(queueNames.notifications, job.data);
      await updateBackendNotificationStatus(job.data.notificationId, {
        status: "delivered",
        deliveredAt: new Date().toISOString(),
      });
      await createBackendEvent({
        eventType: "notification.delivered",
        actor: "notificationWorker",
        payload: {
          notificationId: job.data.notificationId,
        },
      });
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
