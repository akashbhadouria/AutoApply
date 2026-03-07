export type AutomationQueueName =
  | "job-feed-watcher"
  | "job-scanner"
  | "referral-engine"
  | "application-queue"
  | "browser-automation"
  | "notifications";

export interface AutomationQueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  prioritized: number;
  waitingChildren: number;
  workerCount: number;
  isPaused: boolean;
}

export interface AutomationQueueRetryPolicy {
  attempts: number;
  backoffType: "fixed";
  backoffDelayMs: number;
  removeOnComplete: number;
  removeOnFail: number;
}

export interface AutomationFailedJobSummary {
  id: string;
  name: string;
  attemptsMade: number;
  failedReason: string;
  finishedOn: string | null;
}

export interface AutomationQueueSnapshot {
  queueName: AutomationQueueName;
  stats: AutomationQueueStats;
  retryPolicy: AutomationQueueRetryPolicy;
  recentFailures: AutomationFailedJobSummary[];
}

export interface EnqueuedAutomationJob {
  queueName: AutomationQueueName;
  jobId: string;
}

export interface AutomationQueueControlResult {
  queueName: AutomationQueueName;
  action: "pause" | "resume";
  isPaused: boolean;
}
