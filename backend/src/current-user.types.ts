export interface CurrentUserRecord {
  id: number;
  email: string;
  notificationEmail: string | null;
  fullName: string;
  phone: string | null;
  whatsappNumber: string | null;
  location: string | null;
  linkedinUrl: string | null;
  telegramUsername: string | null;
  telegramChatId: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  resumeUrl: string | null;
  resumeStoragePath: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserJobPreferencesRecord {
  userId: number;
  preferredRoles: string[];
  preferredLocations: string[];
  remotePreference: "remote_only" | "hybrid" | "onsite_only" | "any";
  referralPreference: "referral_first" | "instant_apply" | "balanced";
  instantApplyEnabled: boolean;
  blockedCompanies: string[];
  targetApplicationsPerDay: number;
  notificationChannels: Array<"dashboard" | "email" | "telegram" | "whatsapp">;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedAccountRecord {
  id: number;
  userId: number;
  provider: "linkedin" | "gmail" | "outlook" | "telegram" | "whatsapp";
  accountLabel: string;
  connectionStatus: "pending" | "connected" | "degraded" | "disconnected";
  approvalMode: "manual_approval" | "auto_send";
  accountIdentifier: string | null;
  metadata: Record<string, unknown>;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobFeedWatcherRecord {
  id: number;
  userId: number;
  name: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  provider:
    | "linkedin"
    | "instahyre"
    | "hirist"
    | "naukri"
    | "company_site"
    | "greenhouse"
    | "lever"
    | "generic_json"
    | "google_jobs";
  status: "active" | "paused" | "error";
  pollingIntervalSeconds: number;
  searchTitles: string[];
  locations: string[];
  recencyDays: number;
  configuration: Record<string, unknown>;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobFeedCursorRecord {
  watcherId: number;
  lastSeenJobId: string | null;
  lastSeenTimestamp: string | null;
  updatedAt: string;
}

export interface JobDiscoveryEventRecord {
  id: number;
  watcherId: number | null;
  jobId: number | null;
  eventType: "job_discovered" | "fresh_job_detected";
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface JobWatcherActivityRecord {
  watcherId: number;
  watcherName: string;
  sourcePlatform: JobFeedWatcherRecord["sourcePlatform"];
  provider: JobFeedWatcherRecord["provider"];
  status: JobFeedWatcherRecord["status"];
  pollingIntervalSeconds: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastSeenTimestamp: string | null;
  recentDiscoveryCount: number;
  recentFreshCount: number;
}

export interface RecentJobDiscoveryEventRecord extends JobDiscoveryEventRecord {
  watcherName: string;
  sourcePlatform: JobFeedWatcherRecord["sourcePlatform"];
  provider: JobFeedWatcherRecord["provider"];
  company: string | null;
  title: string | null;
}
