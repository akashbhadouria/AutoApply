import { findApplicationByJobId, listApplications, upsertApplication } from "./application.repository.js";
import { upsertApplicationSchema } from "./application.schema.js";
import { z } from "zod";

export async function getApplications() {
  return listApplications();
}

export async function getApplicationByJobId(jobId: string) {
  const normalizedJobId = z.coerce.number().int().positive().parse(jobId);
  return findApplicationByJobId(normalizedJobId);
}

export async function saveApplication(payload: unknown) {
  const input = upsertApplicationSchema.parse(payload);
  return upsertApplication(input);
}
