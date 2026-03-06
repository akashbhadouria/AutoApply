import { Worker } from "bullmq";

import {
  createBackendApplicationSession,
  createBackendEvent,
  discoverBackendJobsBatch,
  createBackendNotification,
  fetchBackendApplicationByJobId,
  fetchBackendContacts,
  fetchBackendFieldMappings,
  fetchBackendProfileFields,
  fetchBackendReferralsByJobId,
  saveBackendApplication,
  saveBackendFieldMapping,
  saveBackendReferral,
  updateBackendNotificationStatus,
} from "./backend.js";
import { runAtsAutofill } from "./ats.js";
import type {
  ApplicationQueueJobData,
  BrowserAutomationJobData,
  JobDiscoveryJobData,
  NotificationJobData,
  ReferralJobData,
} from "./contracts.js";
import { getConnectionOptions } from "./connection.js";
import { queueNames } from "./contracts.js";
import { browserAutomationQueue } from "./queues.js";
import { scanDiscoveredJobs } from "./scanners.js";

function logWorkerStart(name: string, data: unknown) {
  console.log(`[worker:${name}] received`, JSON.stringify(data));
}

function buildReferralDraft(params: {
  contactFirstName: string;
  role: string;
  company: string;
  resumeLink?: string;
  userName?: string;
}) {
  return `Hi ${params.contactFirstName},

I came across the ${params.role} position at ${params.company} and it aligns well with my frontend experience building React and TypeScript applications.

If you think my background could be a fit, I would appreciate any guidance or referral.${params.resumeLink ? ` Resume: ${params.resumeLink}` : ""}

Thanks,
${params.userName ?? "Akash"}`;
}

function buildConnectionDraft(params: { company: string; role: string }) {
  return `Hi, I found the ${params.role} opening at ${params.company} and would value the chance to connect.`;
}

export function startWorkers() {
  const connection = getConnectionOptions();

  const jobScannerWorker = new Worker<JobDiscoveryJobData>(
    queueNames.jobScanner,
    async (job) => {
      logWorkerStart(queueNames.jobScanner, job.data);
      const discoveredJobs = scanDiscoveredJobs(job.data);
      const batchResult = await discoverBackendJobsBatch({
        jobs: discoveredJobs,
      });
      await createBackendEvent({
        eventType: "job_scanner.run_requested",
        actor: "jobScannerWorker",
        payload: {
          searchTitles: job.data.searchTitles,
          locations: job.data.locations,
          recencyDays: job.data.recencyDays,
          discoveredCount: batchResult.data.length,
        },
      });
      await createBackendNotification({
        type: "job_scanner_requested",
        title: "Job scanner completed",
        message: `Discovered ${batchResult.data.length} normalized jobs for ${job.data.searchTitles.length} titles across ${job.data.locations.length} locations.`,
        channel: "dashboard",
        status: "delivered",
      });
    },
    { connection },
  );

  const referralEngineWorker = new Worker<ReferralJobData>(
    queueNames.referralEngine,
    async (job) => {
      logWorkerStart(queueNames.referralEngine, job.data);
      const [existingReferrals, contactsResponse, profileFieldsResponse] = await Promise.all([
        fetchBackendReferralsByJobId(job.data.jobId),
        fetchBackendContacts(),
        fetchBackendProfileFields(),
      ]);
      const alreadyTrackedContactIds = new Set(existingReferrals.data.map((referral) => referral.contactId));
      const profileFieldMap = new Map(profileFieldsResponse.data.map((field) => [field.key, field.value]));
      const resumeLink = profileFieldMap.get("resume_link") ?? profileFieldMap.get("resume");
      const userName = profileFieldMap.get("name");
      const matchingContacts = contactsResponse.data.filter(
        (contact) => !alreadyTrackedContactIds.has(contact.id),
      );

      let createdReferrals = 0;
      for (const contact of matchingContacts.slice(0, 3)) {
        await saveBackendReferral({
          jobId: job.data.jobId,
          contactId: contact.id,
          status: "pending",
          outreachMessage: buildReferralDraft({
            contactFirstName: contact.firstName,
            role: "Frontend Engineer",
            company: contact.company,
            resumeLink,
            userName,
          }),
          connectionRequestMessage: buildConnectionDraft({
            company: contact.company,
            role: "Frontend Engineer",
          }),
          messageSentAt: new Date().toISOString(),
        });
        createdReferrals += 1;
      }

      await createBackendEvent({
        eventType: "referral_engine.run_requested",
        actor: "referralEngineWorker",
        payload: {
          queue: queueNames.referralEngine,
          jobId: job.data.jobId,
          createdReferrals,
        },
        relatedJobId: job.data.jobId,
      });
      await createBackendNotification({
        type: "referral_drafts_created",
        title: "Referral drafts prepared",
        message: `Prepared ${createdReferrals} referral drafts for job ${job.data.jobId}.`,
        channel: "dashboard",
        status: "delivered",
        relatedJobId: job.data.jobId,
      });
    },
    { connection },
  );

  const applicationQueueWorker = new Worker<ApplicationQueueJobData>(
    queueNames.applicationQueue,
    async (job) => {
      logWorkerStart(queueNames.applicationQueue, job.data);
      const [existingApplication, referralsResponse] = await Promise.all([
        fetchBackendApplicationByJobId(job.data.jobId),
        fetchBackendReferralsByJobId(job.data.jobId),
      ]);
      const appliedRecord = existingApplication?.data ?? null;
      const hasSuccessfulReferral = referralsResponse.data.some((referral) => referral.status === "referred");
      const hasPendingReferral = referralsResponse.data.some((referral) =>
        referral.status === "pending" || referral.status === "replied",
      );

      if (appliedRecord?.applied) {
        await createBackendEvent({
          eventType: "application_queue.skipped_already_applied",
          actor: "applicationQueueWorker",
          payload: {
            jobId: job.data.jobId,
            applicationId: appliedRecord.id,
          },
          relatedJobId: job.data.jobId,
        });
        return;
      }

      if (hasSuccessfulReferral) {
        await createBackendEvent({
          eventType: "application_queue.skipped_referred",
          actor: "applicationQueueWorker",
          payload: {
            jobId: job.data.jobId,
          },
          relatedJobId: job.data.jobId,
        });
        return;
      }

      const nextStatus = hasPendingReferral ? "pending" : "applied";
      const application = await saveBackendApplication({
        jobId: job.data.jobId,
        sourcePlatform: job.data.sourcePlatform,
        applied: nextStatus === "applied",
        appliedDate: nextStatus === "applied" ? new Date().toISOString() : undefined,
        status: nextStatus,
      });

      if (nextStatus === "applied") {
        await browserAutomationQueue.add(queueNames.browserAutomation, {
          jobId: job.data.jobId,
          formUrl: `https://apply.example.com/jobs/${job.data.jobId}`,
        });
      }

      await createBackendEvent({
        eventType: nextStatus === "applied" ? "application_queue.application_created" : "application_queue.awaiting_referral",
        actor: "applicationQueueWorker",
        payload: {
          jobId: job.data.jobId,
          sourcePlatform: job.data.sourcePlatform,
          applicationId: application.data.id,
          status: nextStatus,
        },
        relatedJobId: job.data.jobId,
      });
      await createBackendNotification({
        type: nextStatus === "applied" ? "application_created" : "application_waiting_for_referral",
        title: nextStatus === "applied" ? "Application record created" : "Application waiting on referral outcome",
        message:
          nextStatus === "applied"
            ? `Created application tracking and queued browser automation for job ${job.data.jobId}.`
            : `Job ${job.data.jobId} still has pending referral activity, so the application remains pending.`,
        channel: "dashboard",
        status: "delivered",
        relatedJobId: job.data.jobId,
      });
    },
    { connection },
  );

  const browserAutomationWorker = new Worker<BrowserAutomationJobData>(
    queueNames.browserAutomation,
    async (job) => {
      logWorkerStart(queueNames.browserAutomation, job.data);
      const [profileFieldsResponse, fieldMappingsResponse] = await Promise.all([
        fetchBackendProfileFields(),
        fetchBackendFieldMappings(),
      ]);
      const automationResult = await runAtsAutofill({
        formUrl: job.data.formUrl,
        profileFields: profileFieldsResponse.data,
        fieldMappings: fieldMappingsResponse.data,
      });

      if (automationResult.missingRequiredField) {
        if (automationResult.missingRequiredField.profileKey) {
          await saveBackendFieldMapping({
            rawLabel: automationResult.missingRequiredField.label,
            profileKey: automationResult.missingRequiredField.profileKey,
            confidence: "learned",
          });
        }

        await createBackendApplicationSession({
          jobId: job.data.jobId,
          formUrl: job.data.formUrl,
          filledFields: automationResult.filledFields,
          missingField: automationResult.missingRequiredField.label,
          status: "paused",
        });
        await createBackendNotification({
          type: "application_paused_missing_field",
          title: "Application paused for missing field",
          message: `Browser automation paused for job ${job.data.jobId} because ${automationResult.missingRequiredField.label} is not fully mapped yet.`,
          channel: "dashboard",
          status: "delivered",
          relatedJobId: job.data.jobId,
        });
      } else {
        await createBackendApplicationSession({
          jobId: job.data.jobId,
          formUrl: job.data.formUrl,
          filledFields: automationResult.filledFields,
          missingField: "none",
          status: automationResult.submitted ? "completed" : "ready_to_resume",
        });
        await saveBackendApplication({
          jobId: job.data.jobId,
          sourcePlatform: "company_site",
          applied: automationResult.submitted,
          appliedDate: automationResult.submitted ? new Date().toISOString() : undefined,
          status: automationResult.submitted ? "applied" : "pending",
        });
        await createBackendNotification({
          type: automationResult.submitted ? "application_submitted" : "application_form_ready",
          title: automationResult.submitted ? "Application autofill completed" : "ATS form mapped successfully",
          message: automationResult.submitted
            ? `Browser automation autofilled and submitted the ATS flow for job ${job.data.jobId}.`
            : `Browser automation mapped all required fields for job ${job.data.jobId}, but submission still needs a final step.`,
          channel: "dashboard",
          status: "delivered",
          relatedJobId: job.data.jobId,
        });
      }

      await createBackendEvent({
        eventType: automationResult.missingRequiredField
          ? "browser_automation.session_paused"
          : automationResult.submitted
            ? "browser_automation.submitted"
            : "browser_automation.form_filled",
        actor: "browserAutomationWorker",
        payload: {
          jobId: job.data.jobId,
          formUrl: job.data.formUrl,
          resumePath: job.data.resumePath ?? null,
          analyzedFieldCount: automationResult.analyzedFields.length,
          filledFieldCount: Object.keys(automationResult.filledFields).length,
          submitted: automationResult.submitted,
          missingField: automationResult.missingRequiredField?.label ?? null,
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
