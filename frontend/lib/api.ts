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
  discoveredAt: string;
  updatedAt: string;
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
  queueName: "job-scanner" | "referral-engine" | "application-queue" | "browser-automation" | "notifications";
  stats: AutomationQueueStats;
  retryPolicy: AutomationQueueRetryPolicy;
  recentFailures: AutomationFailedJobSummary[];
}

export interface EnqueuedAutomationJob {
  queueName: AutomationQueue["queueName"];
  jobId: string;
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
  recentJobs: Array<{
    id: number;
    company: string;
    title: string;
    location: string;
    sourcePlatforms: string[];
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

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";

function getBackendUrl() {
  return backendUrl;
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
