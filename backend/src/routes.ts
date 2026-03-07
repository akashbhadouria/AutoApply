import type { Request, Response } from "express";
import { Router } from "express";
import { ZodError } from "zod";

import {
  generateReferralDraft,
  suggestFieldMapping,
  summarizeJobDescription,
  summarizeNotification,
} from "./agent.service.js";
import { enqueueAutomationJob, getAutomationQueues, pauseAutomationQueue, resumeAutomationQueue } from "./automation.service.js";
import { getContacts, saveContact } from "./contact.service.js";
import { getEvents, saveEvent } from "./event.service.js";
import { getFieldMappings, saveFieldMapping } from "./field-mapping.service.js";
import { getApplicationByJobId, getApplicationRateWindow, getApplications, saveApplication } from "./application.service.js";
import { getJobs, ingestDiscoveredJob, ingestDiscoveredJobsBatch } from "./job.service.js";
import { changeNotificationStatus, getNotificationById, getNotifications, saveNotification } from "./notification.service.js";
import { getDashboardSummary } from "./dashboard.service.js";
import { getServiceHealthSummary } from "./health.service.js";
import { getProfileFields, removeProfileField, saveProfileField } from "./profile.service.js";
import { changeReferralStatus, getReferrals, getReferralsForJob, getTimedOutPendingReferrals, saveReferral } from "./referral.service.js";
import {
  getApplicationSession,
  getApplicationSessions,
  markApplicationSessionStatus,
  parseResumeApplicationSessionPayload,
  saveApplicationSession,
} from "./session.service.js";
import { getSystemSettings, removeSystemSetting, saveSystemSetting } from "./settings.service.js";

export const apiRouter = Router();

apiRouter.get("/health", async (_request, response, next) => {
  try {
    const health = await getServiceHealthSummary();
    response.status(health.status === "ok" ? 200 : 503).json(health);
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/dashboard/summary", async (_request, response, next) => {
  try {
    const summary = await getDashboardSummary();
    response.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/automation/queues", async (_request, response, next) => {
  try {
    const queues = await getAutomationQueues();
    response.json({ data: queues });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/automation/enqueue", async (request, response, next) => {
  try {
    const job = await enqueueAutomationJob(request.body);
    response.status(201).json({ data: job });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/automation/queues/:queueName/pause", async (request, response, next) => {
  try {
    const result = await pauseAutomationQueue(request.params.queueName as Parameters<typeof pauseAutomationQueue>[0]);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/automation/queues/:queueName/resume", async (request, response, next) => {
  try {
    const result = await resumeAutomationQueue(request.params.queueName as Parameters<typeof resumeAutomationQueue>[0]);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/agents/referral-draft", async (request, response, next) => {
  try {
    const result = await generateReferralDraft(request.body);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/agents/field-mapping-suggestion", async (request, response, next) => {
  try {
    const result = await suggestFieldMapping(request.body);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/agents/job-summary", async (request, response, next) => {
  try {
    const result = await summarizeJobDescription(request.body);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/agents/notification-summary", async (request, response, next) => {
  try {
    const result = await summarizeNotification(request.body);
    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/events", async (_request, response, next) => {
  try {
    const events = await getEvents();
    response.json({ data: events });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/field-mappings", async (_request, response, next) => {
  try {
    const fieldMappings = await getFieldMappings();
    response.json({ data: fieldMappings });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/field-mappings", async (request, response, next) => {
  try {
    const fieldMapping = await saveFieldMapping(request.body);
    response.status(201).json({ data: fieldMapping });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/events", async (request, response, next) => {
  try {
    const event = await saveEvent(request.body);
    response.status(201).json({ data: event });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/profile-fields", async (_request, response, next) => {
  try {
    const fields = await getProfileFields();
    response.json({ data: fields });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/api/profile-fields/:key", async (request, response, next) => {
  try {
    const field = await saveProfileField(request.params.key, request.body);
    response.status(200).json({ data: field });
  } catch (error) {
    next(error);
  }
});

apiRouter.delete("/api/profile-fields/:key", async (request, response, next) => {
  try {
    const deleted = await removeProfileField(request.params.key);
    response.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/jobs", async (_request, response, next) => {
  try {
    const jobs = await getJobs();
    response.json({ data: jobs });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/jobs/discover", async (request, response, next) => {
  try {
    const job = await ingestDiscoveredJob(request.body);
    response.status(201).json({ data: job });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/jobs/discover/batch", async (request, response, next) => {
  try {
    const jobs = await ingestDiscoveredJobsBatch(request.body);
    response.status(201).json({ data: jobs });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/applications", async (_request, response, next) => {
  try {
    const applications = await getApplications();
    response.json({ data: applications });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/applications/rate-window", async (request, response, next) => {
  try {
    const snapshot = await getApplicationRateWindow(
      typeof request.query.hours === "string" ? request.query.hours : undefined,
    );
    response.json({ data: snapshot });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/applications/job/:jobId", async (request, response, next) => {
  try {
    const application = await getApplicationByJobId(request.params.jobId);
    response.status(application ? 200 : 404).json(application ? { data: application } : { error: "Not found" });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/applications", async (request, response, next) => {
  try {
    const application = await saveApplication(request.body);
    response.status(201).json({ data: application });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/contacts", async (_request, response, next) => {
  try {
    const contacts = await getContacts();
    response.json({ data: contacts });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/contacts", async (request, response, next) => {
  try {
    const contact = await saveContact(request.body);
    response.status(201).json({ data: contact });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/referrals", async (_request, response, next) => {
  try {
    const referrals = await getReferrals();
    response.json({ data: referrals });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/referrals/timeouts", async (request, response, next) => {
  try {
    const referrals = await getTimedOutPendingReferrals(
      typeof request.query.olderThanHours === "string" ? request.query.olderThanHours : undefined,
    );
    response.json({ data: referrals });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/referrals/job/:jobId", async (request, response, next) => {
  try {
    const referrals = await getReferralsForJob(request.params.jobId);
    response.json({ data: referrals });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/referrals", async (request, response, next) => {
  try {
    const referral = await saveReferral(request.body);
    response.status(201).json({ data: referral });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/api/referrals/:id/status", async (request, response, next) => {
  try {
    const referral = await changeReferralStatus(request.params.id, request.body);
    if (!referral) {
      response.status(404).json({ error: "Not found" });
      return;
    }

    await saveEvent({
      eventType: "referral.status_changed",
      actor: "referralsApi",
      payload: {
        referralId: referral.id,
        jobId: referral.jobId,
        contactId: referral.contactId,
        status: referral.status,
      },
      relatedJobId: referral.jobId,
    });

    if (referral.status === "replied" || referral.status === "no_response") {
      const queuedJob = await enqueueAutomationJob({
        queueName: "application-queue",
        payload: {
          jobId: referral.jobId,
          sourcePlatform: referral.jobSourcePlatform ?? "company_site",
        },
      });
      await saveEvent({
        eventType: "referral.application_queue_requested",
        actor: "referralsApi",
        payload: {
          referralId: referral.id,
          jobId: referral.jobId,
          referralStatus: referral.status,
          queueName: queuedJob.queueName,
          queuedJobId: queuedJob.jobId,
        },
        relatedJobId: referral.jobId,
      });
      await saveNotification({
        type: "referral_application_queue_requested",
        title: "Referral moved into application flow",
        message: `Referral ${referral.id} is ${referral.status}, so job ${referral.jobId} was queued for application processing.`,
        channel: "dashboard",
        status: "pending",
        relatedJobId: referral.jobId,
        relatedReferralId: referral.id,
      });
    }

    if (referral.status === "referred") {
      await saveNotification({
        type: "referral_marked_referred",
        title: "Referral marked as referred",
        message: `Referral ${referral.id} is marked referred, so direct application should remain skipped for job ${referral.jobId}.`,
        channel: "dashboard",
        status: "pending",
        relatedJobId: referral.jobId,
        relatedReferralId: referral.id,
      });
    }

    response.status(200).json({ data: referral });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/application-sessions", async (_request, response, next) => {
  try {
    const sessions = await getApplicationSessions();
    response.json({ data: sessions });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/application-sessions", async (request, response, next) => {
  try {
    const session = await saveApplicationSession(request.body);
    response.status(201).json({ data: session });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/application-sessions/:id/resume", async (request, response, next) => {
  try {
    const session = await getApplicationSession(request.params.id);
    if (!session) {
      response.status(404).json({ error: "Not found" });
      return;
    }

    if (session.status === "completed") {
      response.status(409).json({ error: "Completed sessions cannot be resumed." });
      return;
    }

    const body = await parseResumeApplicationSessionPayload(request.body);
    const updatedSession = await markApplicationSessionStatus(request.params.id, "ready_to_resume");
    if (!updatedSession) {
      response.status(404).json({ error: "Not found" });
      return;
    }

    const queuedJob = await enqueueAutomationJob({
      queueName: "browser-automation",
      payload: {
        jobId: updatedSession.jobId,
        formUrl: updatedSession.formUrl,
        resumePath: body.resumePath,
      },
    });

    await saveEvent({
      eventType: "application_session.resume_queued",
      actor: "operationsApi",
      payload: {
        sessionId: updatedSession.id,
        jobId: updatedSession.jobId,
        formUrl: updatedSession.formUrl,
        queueName: queuedJob.queueName,
        queuedJobId: queuedJob.jobId,
      },
      relatedJobId: updatedSession.jobId,
    });
    await saveNotification({
      type: "application_session_resume_queued",
      title: "Paused ATS session queued for resume",
      message: `Queued browser automation to resume job ${updatedSession.jobId} from saved session ${updatedSession.id}.`,
      channel: "dashboard",
      status: "pending",
      relatedJobId: updatedSession.jobId,
    });

    response.status(202).json({
      data: {
        session: updatedSession,
        queuedJob,
      },
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/notifications", async (_request, response, next) => {
  try {
    const notifications = await getNotifications();
    response.json({ data: notifications });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/notifications/:id", async (request, response, next) => {
  try {
    const notification = await getNotificationById(request.params.id);
    response.status(notification ? 200 : 404).json(notification ? { data: notification } : { error: "Not found" });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/api/notifications", async (request, response, next) => {
  try {
    const notification = await saveNotification(request.body);
    response.status(201).json({ data: notification });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/api/notifications/:id/status", async (request, response, next) => {
  try {
    const notification = await changeNotificationStatus(request.params.id, request.body);
    response.status(notification ? 200 : 404).json(notification ? { data: notification } : { error: "Not found" });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/settings", async (_request, response, next) => {
  try {
    const settings = await getSystemSettings();
    response.json({ data: settings });
  } catch (error) {
    next(error);
  }
});

apiRouter.put("/api/settings/:key", async (request, response, next) => {
  try {
    const setting = await saveSystemSetting(request.params.key, request.body);
    response.status(200).json({ data: setting });
  } catch (error) {
    next(error);
  }
});

apiRouter.delete("/api/settings/:key", async (request, response, next) => {
  try {
    const deleted = await removeSystemSetting(request.params.key);
    response.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});

export function errorHandler(error: unknown, _request: Request, response: Response, _next: () => void) {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Validation failed",
      details: error.flatten(),
    });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Internal server error" });
}
