import { queueRegistry } from "./automation.queue.js";
import { enqueueAutomationJobSchema } from "./automation.schema.js";
import type { AutomationQueueSnapshot, EnqueuedAutomationJob } from "./automation.types.js";

export async function getAutomationQueues(): Promise<AutomationQueueSnapshot[]> {
  const queueNames = Object.keys(queueRegistry) as Array<keyof typeof queueRegistry>;

  return Promise.all(
    queueNames.map(async (queueName) => {
      const queue = queueRegistry[queueName];
      const [counts, workerCount, isPaused] = await Promise.all([
        queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused", "prioritized", "waiting-children"),
        queue.getWorkersCount(),
        queue.isPaused(),
      ]);

      return {
        queueName,
        stats: {
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
          paused: counts.paused ?? 0,
          prioritized: counts.prioritized ?? 0,
          waitingChildren: counts["waiting-children"] ?? 0,
          workerCount,
          isPaused,
        },
      } satisfies AutomationQueueSnapshot;
    }),
  );
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
