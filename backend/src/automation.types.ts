export type AutomationQueueName =
  | "job-scanner"
  | "referral-engine"
  | "application-queue"
  | "browser-automation"
  | "notifications";

export interface EnqueuedAutomationJob {
  queueName: AutomationQueueName;
  jobId: string;
}

