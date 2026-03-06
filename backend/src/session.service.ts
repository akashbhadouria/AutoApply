import { upsertApplicationSessionSchema } from "./session.schema.js";
import { listApplicationSessions, upsertApplicationSession } from "./session.repository.js";

export async function getApplicationSessions() {
  return listApplicationSessions();
}

export async function saveApplicationSession(payload: unknown) {
  const input = upsertApplicationSessionSchema.parse(payload);
  return upsertApplicationSession(input);
}

