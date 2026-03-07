import {
  applicationSessionIdSchema,
  applicationSessionStatusSchema,
  resumeApplicationSessionSchema,
  upsertApplicationSessionSchema,
} from "./session.schema.js";
import {
  getApplicationSessionById,
  listApplicationSessions,
  updateApplicationSessionStatus,
  upsertApplicationSession,
} from "./session.repository.js";

export async function getApplicationSessions() {
  return listApplicationSessions();
}

export async function getApplicationSession(sessionId: string) {
  const normalizedSessionId = applicationSessionIdSchema.parse(sessionId);
  return getApplicationSessionById(normalizedSessionId);
}

export async function saveApplicationSession(payload: unknown) {
  const input = upsertApplicationSessionSchema.parse(payload);
  return upsertApplicationSession(input);
}

export async function markApplicationSessionStatus(sessionId: string, status: "paused" | "ready_to_resume" | "completed") {
  const normalizedSessionId = applicationSessionIdSchema.parse(sessionId);
  const normalizedStatus = applicationSessionStatusSchema.parse(status);
  return updateApplicationSessionStatus(normalizedSessionId, normalizedStatus);
}

export async function parseResumeApplicationSessionPayload(payload: unknown) {
  return resumeApplicationSessionSchema.parse(payload);
}
