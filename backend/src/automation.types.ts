export type AutomationQueueName =
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

export interface AutomationQueueSnapshot {
  queueName: AutomationQueueName;
  stats: AutomationQueueStats;
}

export interface EnqueuedAutomationJob {
  queueName: AutomationQueueName;
  jobId: string;
}
