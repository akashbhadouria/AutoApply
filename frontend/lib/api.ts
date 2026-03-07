export interface ProfileField {
  key: string;
  label: string;
  value: string;
  valueType: string;
  source: "manual" | "learned" | "imported";
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  primarySourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  sourcePlatforms: Array<"linkedin" | "instahyre" | "hirist" | "naukri" | "company_site">;
  postedDate: string | null;
  firstSeenAt: string;
  freshnessStatus: "fresh" | "recent" | "standard";
  jobPriority: "high" | "normal" | "low";
  applyStrategy: "api" | "http_form" | "browser";
  discoveredByWatcherId: number | null;
  discoveredAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  resumeUrl: string | null;
  resumeStoragePath: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserJobPreferences {
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

export interface ConnectedAccount {
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

export interface JobFeedWatcher {
  id: number;
  userId: number;
  name: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  provider: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site" | "greenhouse" | "lever" | "generic_json" | "google_jobs";
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

export interface JobWatcherActivity {
  watcherId: number;
  watcherName: string;
  sourcePlatform: JobFeedWatcher["sourcePlatform"];
  provider: JobFeedWatcher["provider"];
  status: JobFeedWatcher["status"];
  pollingIntervalSeconds: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastSeenTimestamp: string | null;
  recentDiscoveryCount: number;
  recentFreshCount: number;
}

export interface RecentJobDiscoveryEvent {
  id: number;
  watcherId: number | null;
  watcherName: string;
  sourcePlatform: JobFeedWatcher["sourcePlatform"];
  provider: JobFeedWatcher["provider"];
  jobId: number | null;
  eventType: "job_discovered" | "fresh_job_detected";
  payload: Record<string, unknown>;
  company: string | null;
  title: string | null;
  createdAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  company: string;
  title: string;
  location: string;
  sourcePlatform: Job["primarySourcePlatform"];
  applied: boolean;
  appliedDate: string | null;
  status: "pending" | "applied" | "interview" | "rejected" | "offer";
  createdAt: string;
  updatedAt: string;
}

export interface ApplyAttempt {
  id: number;
  jobId: number;
  strategy: "api" | "http_form" | "browser";
  provider: string;
  status: "queued" | "submitted" | "failed" | "unsupported";
  externalReference: string | null;
  requestPayload: Record<string, unknown>;
  responseSummary: Record<string, unknown>;
  durationMs: number | null;
  createdAt: string;
  company: string;
  title: string;
}

export interface Contact {
  id: number;
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl: string | null;
  email: string | null;
  sourcePlatform: Job["primarySourcePlatform"];
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: number;
  jobId: number;
  contactId: number;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  status: "pending" | "replied" | "referred" | "no_response";
  outreachMessage: string;
  connectionRequestMessage: string | null;
  messageSentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachAttempt {
  id: number;
  referralId: number;
  connectedAccountId: number | null;
  channel: "linkedin" | "email" | "telegram" | "whatsapp";
  approvalStatus: "pending_approval" | "approved" | "rejected" | "not_required";
  executionStatus: "drafted" | "queued" | "sent" | "failed" | "cancelled";
  messageSubject: string | null;
  messageBody: string;
  externalReference: string | null;
  errorMessage: string | null;
  requestedAt: string;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  connectedAccountLabel: string | null;
  connectedAccountProvider: ConnectedAccount["provider"] | null;
}

export interface ApplicationSession {
  id: number;
  jobId: number;
  company: string;
  title: string;
  formUrl: string;
  filledFields: Record<string, string>;
  missingField: string;
  status: "paused" | "ready_to_resume" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  channel: "dashboard" | "email" | "telegram" | "whatsapp";
  status: "pending" | "delivered" | "failed";
  relatedJobId: number | null;
  relatedReferralId: number | null;
  createdAt: string;
  deliveredAt: string | null;
}

export interface Event {
  id: number;
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  relatedJobId: number | null;
  createdAt: string;
}

export interface FieldMapping {
  id: number;
  rawLabel: string;
  normalizedLabel: string;
  profileKey: string;
  confidence: "manual" | "learned" | "suggested";
  createdAt: string;
  updatedAt: string;
}

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

export interface AutomationQueue {
  queueName: "job-feed-watcher" | "job-scanner" | "referral-engine" | "application-queue" | "browser-automation" | "notifications";
  stats: AutomationQueueStats;
  retryPolicy: AutomationQueueRetryPolicy;
  recentFailures: AutomationFailedJobSummary[];
}

export interface EnqueuedAutomationJob {
  queueName: AutomationQueue["queueName"];
  jobId: string;
}

export interface AutomationQueueControlResult {
  queueName: AutomationQueue["queueName"];
  action: "pause" | "resume";
  isPaused: boolean;
}

export interface DashboardMetric {
  label: string;
  value: number;
  detail: string;
}

export interface DashboardStatus {
  label: string;
  status: "healthy" | "degraded";
  detail: string;
}

export interface DashboardScannerSource {
  name: string;
  provider: string;
  platform: string;
  mode: "live" | "fallback";
  discoveredCount: number;
  error?: string;
}

export interface DashboardScannerRun {
  eventId: number;
  createdAt: string;
  searchTitles: string[];
  locations: string[];
  recencyDays: number;
  discoveredCount: number;
  sources: DashboardScannerSource[];
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  statuses: DashboardStatus[];
  applicationBreakdown: Array<{ status: string; count: number }>;
  referralBreakdown: Array<{ status: string; count: number }>;
  freshJobs: Array<{
    id: number;
    company: string;
    title: string;
    location: string;
    sourcePlatforms: string[];
    freshnessStatus: "fresh" | "recent" | "standard";
    jobPriority: "high" | "normal" | "low";
    applyStrategy: "api" | "http_form" | "browser";
    discoveredAt: string;
  }>;
  recentJobs: Array<{
    id: number;
    company: string;
    title: string;
    location: string;
    sourcePlatforms: string[];
    freshnessStatus: "fresh" | "recent" | "standard";
    jobPriority: "high" | "normal" | "low";
    applyStrategy: "api" | "http_form" | "browser";
    discoveredAt: string;
  }>;
  recentEvents: Array<{
    id: number;
    eventType: string;
    actor: string;
    createdAt: string;
  }>;
  latestScannerRun: DashboardScannerRun | null;
}

export interface SystemSetting {
  key: string;
  label: string;
  value: string;
  valueType: "string" | "boolean" | "number" | "json";
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptArtifact {
  templateName: string;
  prompt: string;
  input: Record<string, unknown>;
}

export interface ReferralDraftResult {
  provider: "template";
  outreachMessage: string;
  connectionRequestMessage: string;
  summary: string;
  promptArtifact: PromptArtifact;
}

export interface FieldMappingSuggestionResult {
  provider: "template";
  normalizedLabel: string;
  suggestedProfileKey: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
  promptArtifact: PromptArtifact;
}

export interface JobSummaryResult {
  provider: "template";
  summary: string;
  topSignals: string[];
  risks: string[];
  promptArtifact: PromptArtifact;
}

export interface NotificationSummaryResult {
  provider: "template";
  severity: "high" | "medium" | "low";
  summary: string;
  recommendedAction: string;
  promptArtifact: PromptArtifact;
}

export interface BackendRuntimeStatus {
  backendUrl: string;
  backendStatus: "healthy" | "degraded";
  detail: string;
  services: Array<{
    label: string;
    status: "healthy" | "degraded";
    detail: string;
  }>;
}

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function getBackendUrl() {
  return backendUrl;
}

export async function fetchBackendRuntimeStatus(): Promise<BackendRuntimeStatus> {
  try {
    const response = await fetch(`${getBackendUrl()}/health`, {
      cache: "no-store",
    });

    const payload = (await response.json()) as {
      status?: "ok" | "degraded";
      services?: Array<{
        label: string;
        status: "healthy" | "degraded";
        detail: string;
      }>;
    };
    const services = Array.isArray(payload.services) ? payload.services : [];
    const degradedServices = services.filter((service) => service.status !== "healthy");

    return {
      backendUrl: getBackendUrl(),
      backendStatus: response.ok && payload.status === "ok" ? "healthy" : "degraded",
      detail:
        degradedServices.length === 0
          ? "Frontend and backend are connected. Backend, PostgreSQL, and Redis are healthy."
          : `Connected, but degraded dependencies detected: ${degradedServices.map((service) => service.label).join(", ")}.`,
      services,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown connection error";

    return {
      backendUrl: getBackendUrl(),
      backendStatus: "degraded",
      detail: `Frontend cannot reach the backend runtime. ${detail}`,
      services: [
        {
          label: "Backend",
          status: "degraded",
          detail: detail,
        },
      ],
    };
  }
}

export async function fetchProfileFields(): Promise<ProfileField[]> {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load profile fields");
  }

  const payload = (await response.json()) as { data: ProfileField[] };
  return payload.data;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await fetch(`${getBackendUrl()}/api/me`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load current user");
  }

  const payload = (await response.json()) as { data: CurrentUser };
  return payload.data;
}

export async function upsertCurrentUser(body: {
  email: string;
  fullName: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  resumeStoragePath?: string;
  onboardingCompleted?: boolean;
}) {
  const response = await fetch(`${getBackendUrl()}/api/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save current user");
  }

  return response.json() as Promise<{ data: CurrentUser }>;
}

export async function fetchCurrentUserPreferences(): Promise<UserJobPreferences> {
  const response = await fetch(`${getBackendUrl()}/api/me/preferences`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load user preferences");
  }

  const payload = (await response.json()) as { data: UserJobPreferences };
  return payload.data;
}

export async function upsertCurrentUserPreferences(body: Omit<UserJobPreferences, "userId" | "createdAt" | "updatedAt">) {
  const response = await fetch(`${getBackendUrl()}/api/me/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save user preferences");
  }

  return response.json() as Promise<{ data: UserJobPreferences }>;
}

export async function fetchConnectedAccounts(): Promise<ConnectedAccount[]> {
  const response = await fetch(`${getBackendUrl()}/api/me/connected-accounts`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load connected accounts");
  }

  const payload = (await response.json()) as { data: ConnectedAccount[] };
  return payload.data;
}

export async function createConnectedAccount(body: {
  provider: ConnectedAccount["provider"];
  accountLabel: string;
  connectionStatus?: ConnectedAccount["connectionStatus"];
  approvalMode?: ConnectedAccount["approvalMode"];
  accountIdentifier?: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${getBackendUrl()}/api/me/connected-accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to create connected account");
  }

  return response.json() as Promise<{ data: ConnectedAccount }>;
}

export async function fetchJobFeedWatchers(): Promise<JobFeedWatcher[]> {
  const response = await fetch(`${getBackendUrl()}/api/me/job-watchers`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load job watchers");
  }

  const payload = (await response.json()) as { data: JobFeedWatcher[] };
  return payload.data;
}

export async function fetchJobWatcherActivities(): Promise<JobWatcherActivity[]> {
  const response = await fetch(`${getBackendUrl()}/api/me/job-watchers/activity`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load watcher activity");
  }

  const payload = (await response.json()) as { data: JobWatcherActivity[] };
  return payload.data;
}

export async function fetchRecentJobDiscoveryEvents(input?: {
  limit?: number;
  eventType?: RecentJobDiscoveryEvent["eventType"];
}): Promise<RecentJobDiscoveryEvent[]> {
  const query = new URLSearchParams();
  if (input?.limit) {
    query.set("limit", String(input.limit));
  }
  if (input?.eventType) {
    query.set("eventType", input.eventType);
  }

  const response = await fetch(
    `${getBackendUrl()}/api/me/job-watchers/discovery-events/recent${query.size > 0 ? `?${query.toString()}` : ""}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load recent job discovery events");
  }

  const payload = (await response.json()) as { data: RecentJobDiscoveryEvent[] };
  return payload.data;
}

export async function createJobFeedWatcher(body: {
  name: string;
  sourcePlatform: JobFeedWatcher["sourcePlatform"];
  provider: JobFeedWatcher["provider"];
  status?: JobFeedWatcher["status"];
  pollingIntervalSeconds?: number;
  searchTitles: string[];
  locations: string[];
  recencyDays?: number;
  configuration?: Record<string, unknown>;
}) {
  const response = await fetch(`${getBackendUrl()}/api/me/job-watchers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to create job watcher");
  }

  return response.json() as Promise<{ data: JobFeedWatcher }>;
}

export async function updateJobFeedWatcherStatus(
  watcherId: number,
  body: { status: JobFeedWatcher["status"]; lastError?: string },
) {
  const response = await fetch(`${getBackendUrl()}/api/me/job-watchers/${watcherId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to update watcher status");
  }

  return response.json() as Promise<{ data: JobFeedWatcher }>;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${getBackendUrl()}/api/dashboard/summary`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load dashboard summary");
  }

  const payload = (await response.json()) as { data: DashboardSummary };
  return payload.data;
}

export async function upsertProfileField(key: string, body: { label: string; value: string; source: ProfileField["source"] }) {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save profile field");
  }

  return response.json();
}

export async function removeProfileField(key: string) {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields/${key}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete profile field");
  }
}

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(`${getBackendUrl()}/api/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  const payload = (await response.json()) as { data: Job[] };
  return payload.data;
}

export async function fetchFreshJobs(): Promise<Job[]> {
  const response = await fetch(`${getBackendUrl()}/api/jobs/fresh`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load fresh jobs");
  }

  const payload = (await response.json()) as { data: Job[] };
  return payload.data;
}

export async function discoverJob(body: {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  sourcePlatform: Job["primarySourcePlatform"];
  postedDate?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/jobs/discover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to ingest job");
  }

  return response.json();
}

export async function discoverJobsBatch(body: {
  jobs: Array<{
    company: string;
    title: string;
    location: string;
    jobUrl: string;
    sourcePlatform: Job["primarySourcePlatform"];
    postedDate?: string;
  }>;
}) {
  const response = await fetch(`${getBackendUrl()}/api/jobs/discover/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to ingest jobs batch");
  }

  return response.json();
}

export async function fetchApplications(): Promise<Application[]> {
  const response = await fetch(`${getBackendUrl()}/api/applications`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load applications");
  }

  const payload = (await response.json()) as { data: Application[] };
  return payload.data;
}

export async function fetchApplicationByJobId(jobId: number): Promise<Application | null> {
  const response = await fetch(`${getBackendUrl()}/api/applications/job/${jobId}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load application");
  }

  const payload = (await response.json()) as { data: Application };
  return payload.data;
}

export async function upsertApplication(body: {
  jobId: number;
  sourcePlatform: Job["primarySourcePlatform"];
  applied: boolean;
  appliedDate?: string;
  status: Application["status"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save application");
  }

  return response.json();
}

export async function fetchApplyAttempts(input?: {
  limit?: number;
  status?: ApplyAttempt["status"];
  strategy?: ApplyAttempt["strategy"];
  provider?: string;
}): Promise<ApplyAttempt[]> {
  const query = new URLSearchParams();
  if (input?.limit) {
    query.set("limit", String(input.limit));
  }
  if (input?.status) {
    query.set("status", input.status);
  }
  if (input?.strategy) {
    query.set("strategy", input.strategy);
  }
  if (input?.provider) {
    query.set("provider", input.provider);
  }

  const response = await fetch(`${getBackendUrl()}/api/apply-attempts${query.size > 0 ? `?${query.toString()}` : ""}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load apply attempts");
  }

  const payload = (await response.json()) as { data: ApplyAttempt[] };
  return payload.data;
}

export async function fetchApplyAttemptsByJobId(jobId: number): Promise<ApplyAttempt[]> {
  const response = await fetch(`${getBackendUrl()}/api/apply-attempts/job/${jobId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load apply attempts for job");
  }

  const payload = (await response.json()) as { data: ApplyAttempt[] };
  return payload.data;
}

export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetch(`${getBackendUrl()}/api/contacts`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load contacts");
  }

  const payload = (await response.json()) as { data: Contact[] };
  return payload.data;
}

export async function createContact(body: {
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl?: string;
  email?: string;
  sourcePlatform: Job["primarySourcePlatform"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save contact");
  }

  return response.json();
}

export async function fetchReferrals(): Promise<Referral[]> {
  const response = await fetch(`${getBackendUrl()}/api/referrals`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load referrals");
  }

  const payload = (await response.json()) as { data: Referral[] };
  return payload.data;
}

export async function fetchPendingReferrals(): Promise<Referral[]> {
  const response = await fetch(`${getBackendUrl()}/api/referrals/pending`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load pending referrals");
  }

  const payload = (await response.json()) as { data: Referral[] };
  return payload.data;
}

export async function fetchReferralsByJobId(jobId: number): Promise<Referral[]> {
  const response = await fetch(`${getBackendUrl()}/api/referrals/job/${jobId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load referrals");
  }

  const payload = (await response.json()) as { data: Referral[] };
  return payload.data;
}

export async function upsertReferral(body: {
  jobId: number;
  contactId: number;
  status: Referral["status"];
  outreachMessage: string;
  connectionRequestMessage?: string;
  messageSentAt?: string;
  repliedAt?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/referrals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save referral");
  }

  return response.json();
}

export async function updateReferralStatus(
  id: number,
  body: { status: Referral["status"]; repliedAt?: string },
) {
  const response = await fetch(`${getBackendUrl()}/api/referrals/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to update referral status");
  }

  return response.json();
}

export async function fetchOutreachAttempts(input?: {
  limit?: number;
  approvalStatus?: OutreachAttempt["approvalStatus"];
  executionStatus?: OutreachAttempt["executionStatus"];
  channel?: OutreachAttempt["channel"];
}): Promise<OutreachAttempt[]> {
  const query = new URLSearchParams();
  if (input?.limit) {
    query.set("limit", String(input.limit));
  }
  if (input?.approvalStatus) {
    query.set("approvalStatus", input.approvalStatus);
  }
  if (input?.executionStatus) {
    query.set("executionStatus", input.executionStatus);
  }
  if (input?.channel) {
    query.set("channel", input.channel);
  }

  const response = await fetch(
    `${getBackendUrl()}/api/outreach-attempts${query.size > 0 ? `?${query.toString()}` : ""}`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to load outreach attempts");
  }

  const payload = (await response.json()) as { data: OutreachAttempt[] };
  return payload.data;
}

export async function fetchOutreachAttemptsByReferralId(referralId: number): Promise<OutreachAttempt[]> {
  const response = await fetch(`${getBackendUrl()}/api/outreach-attempts/referral/${referralId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load outreach attempts for referral");
  }

  const payload = (await response.json()) as { data: OutreachAttempt[] };
  return payload.data;
}

export async function createOutreachAttempt(body: {
  referralId: number;
  connectedAccountId?: number;
  channel: OutreachAttempt["channel"];
  approvalStatus?: OutreachAttempt["approvalStatus"];
  executionStatus?: OutreachAttempt["executionStatus"];
  messageSubject?: string;
  messageBody: string;
  externalReference?: string;
  errorMessage?: string;
  approvedAt?: string;
  sentAt?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/outreach-attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to create outreach attempt");
  }

  return response.json() as Promise<{ data: OutreachAttempt }>;
}

export async function updateOutreachAttemptApproval(
  id: number,
  body: { approvalStatus: "approved" | "rejected" | "not_required"; approvedAt?: string },
) {
  const response = await fetch(`${getBackendUrl()}/api/outreach-attempts/${id}/approval`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to update outreach approval");
  }

  return response.json() as Promise<{ data: OutreachAttempt }>;
}

export async function updateOutreachAttemptStatus(
  id: number,
  body: {
    executionStatus: OutreachAttempt["executionStatus"];
    externalReference?: string;
    errorMessage?: string;
    sentAt?: string;
  },
) {
  const response = await fetch(`${getBackendUrl()}/api/outreach-attempts/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to update outreach execution");
  }

  return response.json() as Promise<{ data: OutreachAttempt }>;
}

export async function fetchApplicationSessions(): Promise<ApplicationSession[]> {
  const response = await fetch(`${getBackendUrl()}/api/application-sessions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load application sessions");
  }

  const payload = (await response.json()) as { data: ApplicationSession[] };
  return payload.data;
}

export async function upsertApplicationSession(body: {
  jobId: number;
  formUrl: string;
  filledFields: Record<string, string>;
  missingField: string;
  status: ApplicationSession["status"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/application-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save application session");
  }

  return response.json();
}

export async function resumeApplicationSession(sessionId: number, body?: { resumePath?: string }) {
  const response = await fetch(`${getBackendUrl()}/api/application-sessions/${sessionId}/resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to resume application session");
  }

  return response.json() as Promise<{
    data: {
      session: ApplicationSession;
      queuedJob: EnqueuedAutomationJob;
    };
  }>;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const response = await fetch(`${getBackendUrl()}/api/notifications`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load notifications");
  }

  const payload = (await response.json()) as { data: Notification[] };
  return payload.data;
}

export async function createNotification(body: {
  type: string;
  title: string;
  message: string;
  channel: Notification["channel"];
  status: Notification["status"];
  relatedJobId?: number;
  relatedReferralId?: number;
  deliveredAt?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save notification");
  }

  return response.json();
}

export async function updateNotificationStatus(id: number, body: { status: Notification["status"]; deliveredAt?: string }) {
  const response = await fetch(`${getBackendUrl()}/api/notifications/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to update notification status");
  }

  return response.json();
}

export async function fetchSystemSettings(): Promise<SystemSetting[]> {
  const response = await fetch(`${getBackendUrl()}/api/settings`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load settings");
  }

  const payload = (await response.json()) as { data: SystemSetting[] };
  return payload.data;
}

export async function upsertSystemSetting(
  key: string,
  body: { label: string; value: string; valueType: SystemSetting["valueType"]; category: string },
) {
  const response = await fetch(`${getBackendUrl()}/api/settings/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save setting");
  }

  return response.json();
}

export async function removeSystemSetting(key: string) {
  const response = await fetch(`${getBackendUrl()}/api/settings/${key}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete setting");
  }
}

export async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${getBackendUrl()}/api/events`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load events");
  }

  const payload = (await response.json()) as { data: Event[] };
  return payload.data;
}

export async function createEvent(body: {
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  relatedJobId?: number;
}) {
  const response = await fetch(`${getBackendUrl()}/api/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to create event");
  }

  return response.json();
}

export async function fetchFieldMappings(): Promise<FieldMapping[]> {
  const response = await fetch(`${getBackendUrl()}/api/field-mappings`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load field mappings");
  }

  const payload = (await response.json()) as { data: FieldMapping[] };
  return payload.data;
}

export async function upsertFieldMapping(body: {
  rawLabel: string;
  profileKey: string;
  confidence: FieldMapping["confidence"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/field-mappings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save field mapping");
  }

  return response.json();
}

export async function fetchAutomationQueues(): Promise<AutomationQueue[]> {
  const response = await fetch(`${getBackendUrl()}/api/automation/queues`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load automation queues");
  }

  const payload = (await response.json()) as { data: AutomationQueue[] };
  return payload.data;
}

export async function enqueueAutomationJob(body: {
  queueName: AutomationQueue["queueName"];
  payload: Record<string, unknown>;
}) {
  const response = await fetch(`${getBackendUrl()}/api/automation/enqueue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to enqueue automation job");
  }

  return response.json() as Promise<{ data: EnqueuedAutomationJob }>;
}

export async function pauseAutomationQueue(queueName: string) {
  const response = await fetch(`${getBackendUrl()}/api/automation/queues/${queueName}/pause`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to pause automation queue");
  }

  return response.json() as Promise<{ data: AutomationQueueControlResult }>;
}

export async function resumeAutomationQueue(queueName: string) {
  const response = await fetch(`${getBackendUrl()}/api/automation/queues/${queueName}/resume`, {
    method: "POST",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to resume automation queue");
  }

  return response.json() as Promise<{ data: AutomationQueueControlResult }>;
}

export async function generateReferralDraft(body: {
  company: string;
  jobTitle: string;
  location?: string;
  contactFirstName: string;
  contactTitle?: string;
  userName: string;
  resumeLink?: string;
  portfolioLink?: string;
  yearsOfExperience?: string;
  primarySkills?: string[];
}) {
  const response = await fetch(`${getBackendUrl()}/api/agents/referral-draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to generate referral draft");
  }

  return response.json() as Promise<{ data: ReferralDraftResult }>;
}

export async function suggestFieldMapping(body: {
  rawLabel: string;
  company?: string;
  jobTitle?: string;
  existingProfileKeys: string[];
}) {
  const response = await fetch(`${getBackendUrl()}/api/agents/field-mapping-suggestion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to suggest field mapping");
  }

  return response.json() as Promise<{ data: FieldMappingSuggestionResult }>;
}

export async function summarizeJobDescription(body: {
  company: string;
  jobTitle: string;
  jobDescription: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/agents/job-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to summarize job description");
  }

  return response.json() as Promise<{ data: JobSummaryResult }>;
}

export async function summarizeNotification(body: {
  type: string;
  title: string;
  message: string;
  channel: Notification["channel"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/agents/notification-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to summarize notification");
  }

  return response.json() as Promise<{ data: NotificationSummaryResult }>;
}
