import { queueRegistry } from "./automation.queue.js";
import { enqueueAutomationJobSchema } from "./automation.schema.js";
import type { EnqueuedAutomationJob } from "./automation.types.js";

export function getAutomationQueues() {
  return Object.keys(queueRegistry).map((queueName) => ({ queueName }));
}

export async function enqueueAutomationJob(payload: unknown): Promise<EnqueuedAutomationJob> {
  const input = enqueueAutomationJobSchema.parse(payload);
  const queue = queueRegistry[input.queueName];
  const job = await queue.add(input.queueName, input.payload);

  return {
    queueName: input.queueName,
    jobId: String(job.id),
  };
}

