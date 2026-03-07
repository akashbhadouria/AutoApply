import { discoverJob, findJobById, listFreshJobs, listJobs } from "./job.repository.js";
import { discoverJobsBatchSchema, discoverJobSchema } from "./job.schema.js";
import { z } from "zod";

export async function getJobs() {
  return listJobs();
}

export async function getFreshJobs() {
  return listFreshJobs();
}

export async function getJobById(jobId: string) {
  const normalizedJobId = z.coerce.number().int().positive().parse(jobId);
  return findJobById(normalizedJobId);
}

export async function ingestDiscoveredJob(payload: unknown) {
  const input = discoverJobSchema.parse(payload);
  return discoverJob(input);
}

export async function ingestDiscoveredJobsBatch(payload: unknown) {
  const input = discoverJobsBatchSchema.parse(payload);
  return Promise.all(input.jobs.map((job) => discoverJob(job)));
}
