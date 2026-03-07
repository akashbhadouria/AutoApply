import { getQueueJobOptions, queueRetryPolicies, queueRegistry } from "./automation.queue.js";
import { enqueueAutomationJobSchema } from "./automation.schema.js";
import type {
  AutomationQueueControlResult,
  AutomationQueueName,
  AutomationQueueSnapshot,
  EnqueuedAutomationJob,
} from "./automation.types.js";

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
      const failedJobs = await queue.getFailed(0, 2);

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
        retryPolicy: queueRetryPolicies[queueName],
        recentFailures: failedJobs.map((job) => ({
          id: String(job.id),
          name: job.name,
          attemptsMade: job.attemptsMade,
          failedReason: job.failedReason ?? "Unknown failure",
          finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        })),
      } satisfies AutomationQueueSnapshot;
    }),
  );
}

export async function enqueueAutomationJob(payload: unknown): Promise<EnqueuedAutomationJob> {
  const input = enqueueAutomationJobSchema.parse(payload);
  const queue = queueRegistry[input.queueName];
  const job = await queue.add(input.queueName, input.payload, getQueueJobOptions(input.queueName));

  return {
    queueName: input.queueName,
    jobId: String(job.id),
  };
}

export async function pauseAutomationQueue(queueName: AutomationQueueName): Promise<AutomationQueueControlResult> {
  const queue = queueRegistry[queueName];
  await queue.pause();

  return {
    queueName,
    action: "pause",
    isPaused: await queue.isPaused(),
  };
}

export async function resumeAutomationQueue(queueName: AutomationQueueName): Promise<AutomationQueueControlResult> {
  const queue = queueRegistry[queueName];
  await queue.resume();

  return {
    queueName,
    action: "resume",
    isPaused: await queue.isPaused(),
  };
}
