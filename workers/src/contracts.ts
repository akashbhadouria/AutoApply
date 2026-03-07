import type { JobSourceFeedConfig } from "./config.js";

export const queueNames = {
  jobFeedWatcher: "job-feed-watcher",
  jobScanner: "job-scanner",
  referralEngine: "referral-engine",
  applicationQueue: "application-queue",
  browserAutomation: "browser-automation",
  outreachExecution: "outreach-execution",
  notifications: "notifications",
} as const;

export interface JobFeedWatcherJobData {
  watcherId?: number;
}

export interface JobDiscoveryJobData {
  searchTitles: string[];
  locations: string[];
  recencyDays: number;
  lastSeenTimestamp?: string;
  feeds?: JobSourceFeedConfig[];
}

export interface ReferralJobData {
  mode?: "drafts" | "timeouts";
  jobId?: number;
  olderThanHours?: number;
}

export interface ApplicationQueueJobData {
  jobId: number;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  throttledCount?: number;
}

export interface BrowserAutomationJobData {
  jobId: number;
  formUrl: string;
  resumePath?: string;
  sourcePlatform?: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
}

export interface NotificationJobData {
  notificationId: number;
}

export interface OutreachExecutionJobData {
  outreachAttemptId: number;
}
