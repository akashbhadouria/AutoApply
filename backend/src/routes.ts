import type { Request, Response } from "express";
import { Router } from "express";
import { ZodError } from "zod";

import { enqueueAutomationJob, getAutomationQueues } from "./automation.service.js";
import { getContacts, saveContact } from "./contact.service.js";
import { getEvents, saveEvent } from "./event.service.js";
import { getFieldMappings, saveFieldMapping } from "./field-mapping.service.js";
import { getApplicationByJobId, getApplicationRateWindow, getApplications, saveApplication } from "./application.service.js";
import { getJobs, ingestDiscoveredJob, ingestDiscoveredJobsBatch } from "./job.service.js";
import { changeNotificationStatus, getNotificationById, getNotifications, saveNotification } from "./notification.service.js";
import { getDashboardSummary } from "./dashboard.service.js";
import { getProfileFields, removeProfileField, saveProfileField } from "./profile.service.js";
import { changeReferralStatus, getReferrals, getReferralsForJob, getTimedOutPendingReferrals, saveReferral } from "./referral.service.js";
import { getApplicationSessions, saveApplicationSession } from "./session.service.js";
import { getSystemSettings, removeSystemSetting, saveSystemSetting } from "./settings.service.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

apiRouter.get("/api/dashboard/summary", async (_request, response, next) => {
  try {
    const summary = await getDashboardSummary();
    response.json({ data: summary });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/api/automation/queues", (_request, response) => {
  response.json({ data: getAutomationQueues() });
});

apiRouter.post("/api/automation/enqueue", async (request, response, next) => {
  try {
    const job = await enqueueAutomationJob(request.body);
    response.status(201).json({ data: job });
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
    response.status(referral ? 200 : 404).json(referral ? { data: referral } : { error: "Not found" });
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
