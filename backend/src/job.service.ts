import { discoverJob, listFreshJobs, listJobs } from "./job.repository.js";
import { discoverJobsBatchSchema, discoverJobSchema } from "./job.schema.js";

export async function getJobs() {
  return listJobs();
}

export async function getFreshJobs() {
  return listFreshJobs();
}

export async function ingestDiscoveredJob(payload: unknown) {
  const input = discoverJobSchema.parse(payload);
  return discoverJob(input);
}

export async function ingestDiscoveredJobsBatch(payload: unknown) {
  const input = discoverJobsBatchSchema.parse(payload);
  return Promise.all(input.jobs.map((job) => discoverJob(job)));
}
