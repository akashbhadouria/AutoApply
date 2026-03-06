import { listApplications, upsertApplication } from "./application.repository.js";
import { upsertApplicationSchema } from "./application.schema.js";

export async function getApplications() {
  return listApplications();
}

export async function saveApplication(payload: unknown) {
  const input = upsertApplicationSchema.parse(payload);
  return upsertApplication(input);
}

