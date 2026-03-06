import { discoverJob, listJobs } from "./job.repository.js";
import { discoverJobSchema } from "./job.schema.js";

export async function getJobs() {
  return listJobs();
}

export async function ingestDiscoveredJob(payload: unknown) {
  const input = discoverJobSchema.parse(payload);
  return discoverJob(input);
}

