import { Worker } from "bullmq";

import {
  createBackendApplicationSession,
  createBackendJobDiscoveryEvent,
  fetchBackendApplicationMethods,
  fetchBackendJobById,
  fetchBackendJobFeedCursor,
  createBackendEvent,
  discoverBackendJobsBatch,
  createBackendNotification,
  fetchBackendApplicationByJobId,
  fetchBackendApplicationRateWindow,
  fetchBackendContacts,
  fetchBackendCurrentUserPreferences,
  fetchBackendFieldMappings,
  fetchBackendJobFeedWatchers,
  fetchBackendNotificationById,
  fetchBackendProfileFields,
  fetchBackendReferralsByJobId,
  fetchBackendSettings,
  fetchBackendTimedOutReferrals,
  saveBackendApplyAttempt,
  saveBackendApplication,
  saveBackendJobFeedCursor,
  saveBackendFieldMapping,
  saveBackendReferral,
  updateBackendJobFeedWatcherStatus,
  updateBackendReferralStatus,
  updateBackendNotificationStatus,
} from "./backend.js";
import { runAtsAutofill } from "./ats.js";
import { runDirectApiApply, runHttpFormApply } from "./apply-engine.js";
import type {
  ApplicationQueueJobData,
  BrowserAutomationJobData,
  JobDiscoveryJobData,
  JobFeedWatcherJobData,
  NotificationJobData,
  ReferralJobData,
} from "./contracts.js";
import { getConnectionOptions } from "./connection.js";
import { queueNames } from "./contracts.js";
import { deliverNotification, getNotificationTransportStatus } from "./notification-delivery.js";
import { enqueueApplicationQueueJob, enqueueBrowserAutomationJob, enqueueReferralEngineJob } from "./queues.js";
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

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function buildMockApplicationFormUrl(jobId: number, sourcePlatform: ApplicationQueueJobData["sourcePlatform"]) {
  const provider =
    sourcePlatform === "company_site"
      ? "workday"
      : sourcePlatform === "linkedin"
        ? "greenhouse"
        : sourcePlatform === "instahyre"
          ? "lever"
          : "workday";

  return `https://example.com/${provider}/apply?jobId=${jobId}`;
}

function parseBooleanSetting(rawValue: string | undefined, defaultValue: boolean) {
  if (rawValue === undefined) {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }

  return defaultValue;
}

function parseNumberSetting(rawValue: string | undefined, defaultValue: number) {
  if (rawValue === undefined) {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function inferApplyStrategy(sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site") {
  if (sourcePlatform === "linkedin") {
    return "api" as const;
  }
  if (sourcePlatform === "instahyre" || sourcePlatform === "hirist") {
    return "http_form" as const;
  }
  return "browser" as const;
}

function inferApplyProvider(params: {
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  jobUrl: string;
}) {
  const lower = params.jobUrl.toLowerCase();
  if (params.sourcePlatform === "linkedin" || lower.includes("linkedin")) {
    return "linkedin_easy_apply";
  }
  if (lower.includes("greenhouse")) {
    return "greenhouse";
  }
  if (lower.includes("lever")) {
    return "lever";
  }
  if (lower.includes("workday")) {
    return "workday";
  }
  if (lower.includes("smartrecruiters")) {
    return "smartrecruiters";
  }
  if (lower.includes("taleo")) {
    return "taleo";
  }
  return params.sourcePlatform === "instahyre" ? "lever" : "custom";
}

function deriveStrategyFromMethod(
  method:
    | {
        supportsApiApply: boolean;
        supportsHttpFormApply: boolean;
        requiresBrowser: boolean;
      }
    | undefined,
  fallback: "api" | "http_form" | "browser",
) {
  if (!method) {
    return fallback;
  }
  if (method.supportsApiApply) {
    return "api" as const;
  }
  if (method.supportsHttpFormApply) {
    return "http_form" as const;
  }
  if (method.requiresBrowser) {
    return "browser" as const;
  }
  return fallback;
}

function inferFreshness(postedDate: string) {
  const parsed = Date.parse(postedDate);
  if (Number.isNaN(parsed)) {
    return {
      freshnessStatus: "standard" as const,
      jobPriority: "normal" as const,
    };
  }

  const ageMinutes = Math.max(0, Math.floor((Date.now() - parsed) / 60_000));
  if (ageMinutes <= 5) {
    return {
      freshnessStatus: "fresh" as const,
      jobPriority: "high" as const,
    };
  }

  if (ageMinutes <= 60 * 24) {
    return {
      freshnessStatus: "recent" as const,
      jobPriority: "normal" as const,
    };
  }

  return {
    freshnessStatus: "standard" as const,
    jobPriority: "normal" as const,
  };
}

export function startWorkers() {
  const connection = getConnectionOptions();

  const jobFeedWatcherWorker = new Worker<JobFeedWatcherJobData>(
    queueNames.jobFeedWatcher,
    async (job) => {
      logWorkerStart(queueNames.jobFeedWatcher, job.data);
      const [watchersResponse, contactsResponse, preferencesResponse] = await Promise.all([
        fetchBackendJobFeedWatchers(),
        fetchBackendContacts(),
        fetchBackendCurrentUserPreferences(),
      ]);
      const watchers = job.data.watcherId
        ? watchersResponse.data.filter((watcher) => watcher.id === job.data.watcherId && watcher.status === "active")
        : watchersResponse.data.filter((watcher) => watcher.status === "active");
      const contacts = contactsResponse.data;
      const preferences = preferencesResponse.data;

      let totalDiscovered = 0;
      let freshJobs = 0;
      let referralQueued = 0;
      let applicationQueued = 0;

      for (const watcher of watchers) {
        try {
          const cursorResponse = await fetchBackendJobFeedCursor(watcher.id);
          const scannerRun = await scanDiscoveredJobs({
            searchTitles: watcher.searchTitles,
            locations: watcher.locations,
            recencyDays: watcher.recencyDays,
            lastSeenTimestamp: cursorResponse?.data.lastSeenTimestamp ?? undefined,
          });

          const jobs = scannerRun.jobs.map((discoveredJob) => {
            const freshness = inferFreshness(discoveredJob.postedDate);

            return {
              ...discoveredJob,
              firstSeenAt: new Date().toISOString(),
              freshnessStatus: freshness.freshnessStatus,
              jobPriority: freshness.jobPriority,
              applyProvider: inferApplyProvider({
                sourcePlatform: discoveredJob.sourcePlatform,
                jobUrl: discoveredJob.jobUrl,
              }),
              applyStrategy: inferApplyStrategy(discoveredJob.sourcePlatform),
              discoveredByWatcherId: watcher.id,
            };
          });

          const batchResult = await discoverBackendJobsBatch({ jobs });
          totalDiscovered += batchResult.data.length;

          let latestSeenTimestamp = cursorResponse?.data.lastSeenTimestamp ?? null;
          let latestSeenJobId = cursorResponse?.data.lastSeenJobId ?? null;

          for (const [index, discoveredJob] of jobs.entries()) {
            const discoveredId = batchResult.data[index]?.id;
            if (!discoveredId) {
              continue;
            }

            await createBackendJobDiscoveryEvent(watcher.id, {
              jobId: discoveredId,
              eventType: "job_discovered",
              payload: {
                company: discoveredJob.company,
                title: discoveredJob.title,
                sourcePlatform: discoveredJob.sourcePlatform,
                applyStrategy: discoveredJob.applyStrategy,
                applyProvider: discoveredJob.applyProvider,
              },
            });

            const discoveredPostedTime = Date.parse(discoveredJob.postedDate);
            if (!Number.isNaN(discoveredPostedTime)) {
              if (!latestSeenTimestamp || discoveredPostedTime > Date.parse(latestSeenTimestamp)) {
                latestSeenTimestamp = new Date(discoveredPostedTime).toISOString();
                latestSeenJobId = String(discoveredId);
              }
            }

            if (discoveredJob.freshnessStatus !== "fresh") {
              continue;
            }

            freshJobs += 1;
            await createBackendJobDiscoveryEvent(watcher.id, {
              jobId: discoveredId,
              eventType: "fresh_job_detected",
              payload: {
                company: discoveredJob.company,
                title: discoveredJob.title,
                sourcePlatform: discoveredJob.sourcePlatform,
                applyStrategy: discoveredJob.applyStrategy,
                applyProvider: discoveredJob.applyProvider,
              },
            });
            const matchingContacts = contacts.filter(
              (contact) => normalizeText(contact.company) === normalizeText(discoveredJob.company),
            );
            const shouldPreferReferral =
              preferences.referralPreference !== "instant_apply" && matchingContacts.length > 0;
            const shouldInstantApply =
              preferences.instantApplyEnabled && (!shouldPreferReferral || preferences.referralPreference === "instant_apply");

            await createBackendEvent({
              eventType: "fresh_job_detected",
              actor: "jobFeedWatcherWorker",
              payload: {
                watcherId: watcher.id,
                jobId: discoveredId,
                company: discoveredJob.company,
                title: discoveredJob.title,
                sourcePlatform: discoveredJob.sourcePlatform,
                applyStrategy: discoveredJob.applyStrategy,
              },
              relatedJobId: discoveredId,
            });

            if (shouldPreferReferral) {
              await enqueueReferralEngineJob({
                mode: "drafts",
                jobId: discoveredId,
              }, {
                priority: 10,
              });
              referralQueued += 1;
              await createBackendEvent({
                eventType: "referral_requested",
                actor: "jobFeedWatcherWorker",
                payload: {
                  watcherId: watcher.id,
                  jobId: discoveredId,
                  matchingContacts: matchingContacts.length,
                },
                relatedJobId: discoveredId,
              });
            } else if (shouldInstantApply) {
              await enqueueApplicationQueueJob(
                {
                  jobId: discoveredId,
                  sourcePlatform: discoveredJob.sourcePlatform,
                },
                {
                  priority: 20,
                },
              );
              applicationQueued += 1;
              await createBackendEvent({
                eventType: "application_requested",
                actor: "jobFeedWatcherWorker",
                payload: {
                  watcherId: watcher.id,
                  jobId: discoveredId,
                  reason: "fresh_job_no_referral_path",
                },
                relatedJobId: discoveredId,
              });
            }
          }

          if (latestSeenTimestamp || latestSeenJobId) {
            await saveBackendJobFeedCursor(watcher.id, {
              lastSeenJobId: latestSeenJobId,
              lastSeenTimestamp: latestSeenTimestamp,
            });
          }

          await updateBackendJobFeedWatcherStatus(watcher.id, {
            status: "active",
          });
          await createBackendEvent({
            eventType: "job_discovered",
            actor: "jobFeedWatcherWorker",
            payload: {
              watcherId: watcher.id,
              watcherName: watcher.name,
              discoveredCount: batchResult.data.length,
              sourcePlatform: watcher.sourcePlatform,
            },
          });
        } catch (error) {
          await updateBackendJobFeedWatcherStatus(watcher.id, {
            status: "error",
            lastError: error instanceof Error ? error.message : "Unknown watcher error",
          });
        }
      }

      await createBackendNotification({
        type: "job_feed_watchers_completed",
        title: "Job watcher sweep completed",
        message:
          watchers.length === 0
            ? "No active job watchers were available for this run."
            : `Processed ${watchers.length} watcher(s), discovered ${totalDiscovered} jobs, flagged ${freshJobs} fresh jobs, queued ${referralQueued} referral runs, and queued ${applicationQueued} applications.`,
        channel: "dashboard",
        status: "delivered",
      });
    },
    { connection },
  );

  const jobScannerWorker = new Worker<JobDiscoveryJobData>(
    queueNames.jobScanner,
    async (job) => {
      logWorkerStart(queueNames.jobScanner, job.data);
      const scannerRun = await scanDiscoveredJobs(job.data);
      const batchResult = await discoverBackendJobsBatch({
        jobs: scannerRun.jobs,
      });
      await createBackendEvent({
        eventType: "job_scanner.run_requested",
        actor: "jobScannerWorker",
        payload: {
          searchTitles: job.data.searchTitles,
          locations: job.data.locations,
          recencyDays: job.data.recencyDays,
          discoveredCount: batchResult.data.length,
          scannerSources: scannerRun.sources,
        },
      });
      const liveSourceCount = scannerRun.sources.filter((source) => source.mode === "live").length;
      const liveErrorCount = scannerRun.sources.filter((source) => source.mode === "live" && source.error).length;
      await createBackendNotification({
        type: "job_scanner_requested",
        title: "Job scanner completed",
        message:
          liveSourceCount === 0
            ? `Discovered ${batchResult.data.length} normalized jobs using fallback scanner data for ${job.data.searchTitles.length} titles across ${job.data.locations.length} locations.`
            : `Discovered ${batchResult.data.length} normalized jobs from ${liveSourceCount} configured live feed(s)${liveErrorCount > 0 ? ` with ${liveErrorCount} feed error(s)` : ""}.`,
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
      if (job.data.mode === "timeouts") {
        const olderThanHours = job.data.olderThanHours ?? 24;
        const timedOutReferralsResponse = await fetchBackendTimedOutReferrals(olderThanHours);

        let processedCount = 0;
        for (const referral of timedOutReferralsResponse.data) {
          await updateBackendReferralStatus(referral.id, {
            status: "no_response",
          });
          await enqueueApplicationQueueJob({
            jobId: referral.jobId,
            sourcePlatform: referral.jobSourcePlatform,
          });
          processedCount += 1;
        }

        await createBackendEvent({
          eventType: "referral_engine.timeouts_processed",
          actor: "referralEngineWorker",
          payload: {
            queue: queueNames.referralEngine,
            olderThanHours,
            processedCount,
          },
        });
        await createBackendNotification({
          type: "referral_timeouts_processed",
          title: "Referral timeout sweep completed",
          message:
            processedCount === 0
              ? `No pending referrals exceeded the ${olderThanHours}-hour timeout window.`
              : `Marked ${processedCount} referrals as no_response and queued their jobs for application processing.`,
          channel: "dashboard",
          status: "delivered",
        });
        return;
      }

      if (!job.data.jobId) {
        throw new Error("referralEngineWorker requires jobId when mode is drafts.");
      }

      const [existingReferrals, contactsResponse, profileFieldsResponse] = await Promise.all([
        fetchBackendReferralsByJobId(job.data.jobId),
        fetchBackendContacts(),
        fetchBackendProfileFields(),
      ]);
      const alreadyTrackedContactIds = new Set(existingReferrals.data.map((referral) => referral.contactId));
      const profileFieldMap = new Map(profileFieldsResponse.data.map((field) => [field.key, field.value]));
      const resumeLink = profileFieldMap.get("resume_link") ?? profileFieldMap.get("resume");
      const userName = profileFieldMap.get("name");
      const referralCompany = existingReferrals.data[0]?.company;
      const matchingContacts = contactsResponse.data.filter((contact) => {
        if (alreadyTrackedContactIds.has(contact.id)) {
          return false;
        }

        if (!referralCompany) {
          return true;
        }

        return normalizeText(contact.company) === normalizeText(referralCompany);
      });

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
      const [jobRecordResponse, methodsResponse, existingApplication, referralsResponse, settingsResponse, rateWindowResponse] = await Promise.all([
        fetchBackendJobById(job.data.jobId),
        fetchBackendApplicationMethods(),
        fetchBackendApplicationByJobId(job.data.jobId),
        fetchBackendReferralsByJobId(job.data.jobId),
        fetchBackendSettings(),
        fetchBackendApplicationRateWindow(1),
      ]);
      const jobRecord = jobRecordResponse?.data ?? null;
      const appliedRecord = existingApplication?.data ?? null;
      const hasSuccessfulReferral = referralsResponse.data.some((referral) => referral.status === "referred");
      const hasPendingReferral = referralsResponse.data.some((referral) => referral.status === "pending");
      const settings = new Map(settingsResponse.data.map((setting) => [setting.key, setting.value]));
      const hourlyLimit = parseNumberSetting(settings.get("application_rate_limit_per_hour"), 10);
      const method = methodsResponse.data.find((entry) => entry.provider === jobRecord?.applyProvider);
      const applyStrategy = deriveStrategyFromMethod(
        method,
        jobRecord?.applyStrategy ?? inferApplyStrategy(job.data.sourcePlatform),
      );

      if (!jobRecord) {
        throw new Error(`Job ${job.data.jobId} could not be loaded for application processing.`);
      }

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

      if (!hasPendingReferral && rateWindowResponse.data.appliedCount >= hourlyLimit) {
        const oldestAppliedAt = rateWindowResponse.data.oldestAppliedAt
          ? new Date(rateWindowResponse.data.oldestAppliedAt).getTime()
          : Date.now();
        const retryDelayMs = Math.max(oldestAppliedAt + 60 * 60 * 1000 - Date.now() + 5_000, 60_000);
        const throttledCount = (job.data.throttledCount ?? 0) + 1;

        await enqueueApplicationQueueJob({
          ...job.data,
          throttledCount,
        }, {
          delay: retryDelayMs,
        });

        await createBackendEvent({
          eventType: "application_queue.rate_limited",
          actor: "applicationQueueWorker",
          payload: {
            jobId: job.data.jobId,
            sourcePlatform: job.data.sourcePlatform,
            appliedCountLastHour: rateWindowResponse.data.appliedCount,
            hourlyLimit,
            retryDelayMs,
            throttledCount,
          },
          relatedJobId: job.data.jobId,
        });
        await createBackendNotification({
          type: "application_rate_limited",
          title: "Application queue throttled",
          message: `Job ${job.data.jobId} was deferred because the hourly application cap of ${hourlyLimit} has been reached.`,
          channel: "dashboard",
          status: "pending",
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

      if (nextStatus === "applied" && applyStrategy === "browser") {
        await saveBackendApplyAttempt({
          jobId: job.data.jobId,
          strategy: "browser",
          provider: jobRecord.applyProvider,
          status: "queued",
          requestPayload: {
            formUrl: buildMockApplicationFormUrl(job.data.jobId, job.data.sourcePlatform),
          },
          responseSummary: {
            reason: "Browser automation required for this job strategy.",
          },
        });
        await enqueueBrowserAutomationJob({
          jobId: job.data.jobId,
          formUrl: buildMockApplicationFormUrl(job.data.jobId, job.data.sourcePlatform),
          sourcePlatform: job.data.sourcePlatform,
        });
      }

      if (nextStatus === "applied" && applyStrategy !== "browser") {
        const executionResult =
          applyStrategy === "api"
            ? await runDirectApiApply({
                jobId: jobRecord.id,
                company: jobRecord.company,
                title: jobRecord.title,
                jobUrl: jobRecord.jobUrl,
                sourcePlatform: job.data.sourcePlatform,
              })
            : await runHttpFormApply({
                jobId: jobRecord.id,
                company: jobRecord.company,
                title: jobRecord.title,
                jobUrl: jobRecord.jobUrl,
                sourcePlatform: job.data.sourcePlatform,
              });

        await saveBackendApplyAttempt({
          jobId: job.data.jobId,
          strategy: applyStrategy,
          provider: jobRecord.applyProvider || executionResult.provider,
          status: executionResult.status,
          externalReference: executionResult.externalReference,
          requestPayload: {
            company: jobRecord.company,
            title: jobRecord.title,
            sourcePlatform: job.data.sourcePlatform,
            strategy: applyStrategy,
          },
          responseSummary: executionResult.responseSummary,
          durationMs: executionResult.durationMs,
        });

        if (executionResult.shouldFallbackToBrowser) {
          await saveBackendApplyAttempt({
            jobId: job.data.jobId,
            strategy: "browser",
            provider: jobRecord.applyProvider,
            status: "queued",
            requestPayload: {
              formUrl: buildMockApplicationFormUrl(job.data.jobId, job.data.sourcePlatform),
              fallbackFrom: applyStrategy,
            },
            responseSummary: {
              reason: "Primary apply strategy is unsupported; browser fallback queued.",
            },
          });
          await enqueueBrowserAutomationJob({
            jobId: job.data.jobId,
            formUrl: buildMockApplicationFormUrl(job.data.jobId, job.data.sourcePlatform),
            sourcePlatform: job.data.sourcePlatform,
          });
          await createBackendEvent({
            eventType: "application_fallback_requested",
            actor: "applicationQueueWorker",
            payload: {
              jobId: job.data.jobId,
              sourcePlatform: job.data.sourcePlatform,
              fromStrategy: applyStrategy,
              toStrategy: "browser",
              provider: jobRecord.applyProvider,
            },
            relatedJobId: job.data.jobId,
          });
        } else {
          await createBackendEvent({
            eventType: "application_submitted",
            actor: "applicationQueueWorker",
            payload: {
              jobId: job.data.jobId,
              sourcePlatform: job.data.sourcePlatform,
              strategy: applyStrategy,
              provider: jobRecord.applyProvider || executionResult.provider,
              externalReference: executionResult.externalReference,
              durationMs: executionResult.durationMs,
            },
            relatedJobId: job.data.jobId,
          });
        }
      }

      await createBackendEvent({
        eventType: nextStatus === "applied" ? "application_queue.application_created" : "application_queue.awaiting_referral",
        actor: "applicationQueueWorker",
        payload: {
          jobId: job.data.jobId,
          sourcePlatform: job.data.sourcePlatform,
          applicationId: application.data.id,
          status: nextStatus,
          applyStrategy,
        },
        relatedJobId: job.data.jobId,
      });
      await createBackendNotification({
        type: nextStatus === "applied" ? "application_created" : "application_waiting_for_referral",
        title: nextStatus === "applied" ? "Application record created" : "Application waiting on referral outcome",
        message:
          nextStatus === "applied"
            ? applyStrategy === "browser"
              ? `Created application tracking and queued browser automation for job ${job.data.jobId}.`
              : `Created application tracking and executed ${applyStrategy} apply flow for job ${job.data.jobId}.`
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
      const resumePath =
        job.data.resumePath ??
        profileFieldsResponse.data.find((field) =>
          ["resume_path", "resume_file", "resume_local_path"].includes(field.key),
        )?.value;
      const automationResult = await runAtsAutofill({
        formUrl: job.data.formUrl,
        profileFields: profileFieldsResponse.data,
        fieldMappings: fieldMappingsResponse.data,
        resumePath,
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
          sourcePlatform: job.data.sourcePlatform ?? "company_site",
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
          provider: automationResult.provider,
          resumePath: resumePath ?? null,
          analyzedFieldCount: automationResult.analyzedFields.length,
          filledFieldCount: Object.keys(automationResult.filledFields).length,
          stepsCompleted: automationResult.stepsCompleted,
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
      const [notificationResponse, settingsResponse] = await Promise.all([
        fetchBackendNotificationById(job.data.notificationId),
        fetchBackendSettings(),
      ]);

      if (!notificationResponse) {
        await createBackendEvent({
          eventType: "notification.missing",
          actor: "notificationWorker",
          payload: {
            notificationId: job.data.notificationId,
          },
        });
        return;
      }

      const notification = notificationResponse.data;
      if (notification.status !== "pending") {
        await createBackendEvent({
          eventType: "notification.skipped_already_processed",
          actor: "notificationWorker",
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            currentStatus: notification.status,
          },
        });
        return;
      }

      const settings = new Map(settingsResponse.data.map((setting) => [setting.key, setting.value]));
      const settingKey = `${notification.channel}_enabled`;
      const channelEnabled = parseBooleanSetting(
        settings.get(settingKey),
        notification.channel === "dashboard",
      );
      const transportStatus = getNotificationTransportStatus(notification.channel);

      if (!channelEnabled) {
        await updateBackendNotificationStatus(notification.id, {
          status: "failed",
        });
        await createBackendEvent({
          eventType: "notification.delivery_blocked",
          actor: "notificationWorker",
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            reason: "channel_disabled",
            settingKey,
          },
        });
        return;
      }

      if (!transportStatus.configured) {
        await updateBackendNotificationStatus(notification.id, {
          status: "failed",
        });
        await createBackendEvent({
          eventType: "notification.delivery_blocked",
          actor: "notificationWorker",
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            reason: "transport_unconfigured",
            transport: transportStatus.transport,
          },
        });
        return;
      }

      try {
        const delivery = await deliverNotification(notification);
        await updateBackendNotificationStatus(notification.id, {
          status: "delivered",
          deliveredAt: new Date().toISOString(),
        });
        await createBackendEvent({
          eventType: "notification.delivered",
          actor: "notificationWorker",
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            transport: delivery.transport,
            mode: delivery.mode,
          },
        });
      } catch (error) {
        await updateBackendNotificationStatus(notification.id, {
          status: "failed",
        });
        await createBackendEvent({
          eventType: "notification.delivery_failed",
          actor: "notificationWorker",
          payload: {
            notificationId: notification.id,
            channel: notification.channel,
            transport: transportStatus.transport,
            error: error instanceof Error ? error.message : "Unknown delivery error",
          },
        });
      }
    },
    { connection },
  );

  return {
    async close() {
      await Promise.all([
        jobFeedWatcherWorker.close(),
        jobScannerWorker.close(),
        referralEngineWorker.close(),
        applicationQueueWorker.close(),
        browserAutomationWorker.close(),
        notificationWorker.close(),
      ]);
    },
  };
}
