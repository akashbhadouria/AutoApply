export const queueNames = {
  jobScanner: "job-scanner",
  referralEngine: "referral-engine",
  applicationQueue: "application-queue",
  browserAutomation: "browser-automation",
  notifications: "notifications",
} as const;

export interface JobDiscoveryJobData {
  searchTitles: string[];
  locations: string[];
  recencyDays: number;
}

export interface ReferralJobData {
  jobId: number;
}

export interface ApplicationQueueJobData {
  jobId: number;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
}

export interface BrowserAutomationJobData {
  jobId: number;
  formUrl: string;
  resumePath?: string;
}

export interface NotificationJobData {
  notificationId: number;
}

