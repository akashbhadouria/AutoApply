import { env } from "./config.js";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${env.backendUrl}${path}`, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function createBackendEvent(body: {
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  relatedJobId?: number;
}) {
  return request<{ data: { id: number } }>("/api/events", {
    method: "POST",
    body,
  });
}

export async function createBackendNotification(body: {
  type: string;
  title: string;
  message: string;
  channel: "dashboard" | "email" | "telegram" | "whatsapp";
  status: "pending" | "delivered" | "failed";
  relatedJobId?: number;
  relatedReferralId?: number;
}) {
  return request<{ data: { id: number } }>("/api/notifications", {
    method: "POST",
    body,
  });
}

export async function fetchBackendApplicationByJobId(jobId: number) {
  const response = await fetch(`${env.backendUrl}/api/applications/job/${jobId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} /api/applications/job/${jobId}`);
  }

  return response.json() as Promise<{
    data: {
      id: number;
      jobId: number;
      applied: boolean;
      status: "pending" | "applied" | "interview" | "rejected" | "offer";
    };
  }>;
}

export async function fetchBackendJobById(jobId: number) {
  const response = await fetch(`${env.backendUrl}/api/jobs/${jobId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} /api/jobs/${jobId}`);
  }

  return response.json() as Promise<{
    data: {
      id: number;
      company: string;
      title: string;
      location: string;
      jobUrl: string;
      primarySourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
      applyStrategy: "api" | "http_form" | "browser";
      applyProvider: string;
    };
  }>;
}

export async function fetchBackendApplicationMethods() {
  return request<{
    data: Array<{
      provider: string;
      sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
      supportsApiApply: boolean;
      supportsHttpFormApply: boolean;
      requiresBrowser: boolean;
      priorityRank: number;
      notes: string | null;
    }>;
  }>("/api/application-methods");
}

export async function fetchBackendApplicationRateWindow(hours = 1) {
  return request<{
    data: {
      appliedCount: number;
      oldestAppliedAt: string | null;
    };
  }>(`/api/applications/rate-window?hours=${hours}`);
}

export async function fetchBackendReferralsByJobId(jobId: number) {
  return request<{
    data: Array<{
      id: number;
      jobId: number;
      contactId: number;
      company: string;
      jobTitle: string;
      contactName: string;
      status: "pending" | "replied" | "referred" | "no_response";
    }>;
  }>(`/api/referrals/job/${jobId}`);
}

export async function fetchBackendTimedOutReferrals(olderThanHours = 24) {
  return request<{
    data: Array<{
      id: number;
      jobId: number;
      contactId: number;
      company: string;
      jobTitle: string;
      contactName: string;
      contactRole: string;
      jobSourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
      status: "pending" | "replied" | "referred" | "no_response";
      outreachMessage: string;
      connectionRequestMessage: string | null;
      messageSentAt: string | null;
    }>;
  }>(`/api/referrals/timeouts?olderThanHours=${olderThanHours}`);
}

export async function fetchBackendContacts() {
  return request<{
    data: Array<{
      id: number;
      company: string;
      fullName: string;
      firstName: string;
      title: string;
      sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
    }>;
  }>("/api/contacts");
}

export async function fetchBackendProfileFields() {
  return request<{
    data: Array<{
      key: string;
      value: string;
    }>;
  }>("/api/profile-fields");
}

export async function fetchBackendSettings() {
  return request<{
    data: Array<{
      key: string;
      value: string;
      valueType: "string" | "boolean" | "number" | "json";
      category: string;
    }>;
  }>("/api/settings");
}

export async function fetchBackendCurrentUserPreferences() {
  return request<{
    data: {
      preferredRoles: string[];
      preferredLocations: string[];
      remotePreference: "remote_only" | "hybrid" | "onsite_only" | "any";
      referralPreference: "referral_first" | "instant_apply" | "balanced";
      instantApplyEnabled: boolean;
      blockedCompanies: string[];
      targetApplicationsPerDay: number;
      notificationChannels: Array<"dashboard" | "email" | "telegram" | "whatsapp">;
    };
  }>("/api/me/preferences");
}

export async function fetchBackendNotificationById(notificationId: number) {
  const response = await fetch(`${env.backendUrl}/api/notifications/${notificationId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status} /api/notifications/${notificationId}`);
  }

  return response.json() as Promise<{
    data: {
      id: number;
      type: string;
      title: string;
      message: string;
      channel: "dashboard" | "email" | "telegram" | "whatsapp";
      status: "pending" | "delivered" | "failed";
      deliveredAt: string | null;
    };
  }>;
}

export async function fetchBackendFieldMappings() {
  return request<{
    data: Array<{
      id: number;
      rawLabel: string;
      normalizedLabel: string;
      profileKey: string;
      confidence: "manual" | "learned" | "suggested";
    }>;
  }>("/api/field-mappings");
}

export async function saveBackendFieldMapping(body: {
  rawLabel: string;
  profileKey: string;
  confidence: "manual" | "learned" | "suggested";
}) {
  return request<{ data: { id: number } }>("/api/field-mappings", {
    method: "POST",
    body,
  });
}

export async function saveBackendApplication(body: {
  jobId: number;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  applied: boolean;
  appliedDate?: string;
  status: "pending" | "applied" | "interview" | "rejected" | "offer";
}) {
  return request<{ data: { id: number } }>("/api/applications", {
    method: "POST",
    body,
  });
}

export async function saveBackendApplyAttempt(body: {
  jobId: number;
  strategy: "api" | "http_form" | "browser";
  provider: string;
  status: "queued" | "submitted" | "failed" | "unsupported";
  externalReference?: string;
  requestPayload?: Record<string, unknown>;
  responseSummary?: Record<string, unknown>;
  durationMs?: number;
}) {
  return request<{ data: { id: number } }>("/api/apply-attempts", {
    method: "POST",
    body,
  });
}

export async function saveBackendReferral(body: {
  jobId: number;
  contactId: number;
  status: "pending" | "replied" | "referred" | "no_response";
  outreachMessage: string;
  connectionRequestMessage?: string;
  messageSentAt?: string;
}) {
  return request<{ data: { id: number } }>("/api/referrals", {
    method: "POST",
    body,
  });
}

export async function updateBackendReferralStatus(
  referralId: number,
  body: {
    status: "pending" | "replied" | "referred" | "no_response";
    repliedAt?: string;
  },
) {
  return request<{ data: { id: number } }>(`/api/referrals/${referralId}/status`, {
    method: "PUT",
    body,
  });
}

export async function updateBackendNotificationStatus(
  notificationId: number,
  body: { status: "pending" | "delivered" | "failed"; deliveredAt?: string },
) {
  return request<{ data: { id: number } }>(`/api/notifications/${notificationId}/status`, {
    method: "PUT",
    body,
  });
}

export async function createBackendApplicationSession(body: {
  jobId: number;
  formUrl: string;
  filledFields: Record<string, string>;
  missingField: string;
  status: "paused" | "ready_to_resume" | "completed";
}) {
  return request<{ data: { id: number } }>("/api/application-sessions", {
    method: "POST",
    body,
  });
}

export async function discoverBackendJobsBatch(body: {
  jobs: Array<{
    company: string;
    title: string;
    location: string;
    jobUrl: string;
    sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
    postedDate: string;
    firstSeenAt?: string;
    freshnessStatus?: "fresh" | "recent" | "standard";
    jobPriority?: "high" | "normal" | "low";
    applyStrategy?: "api" | "http_form" | "browser";
    discoveredByWatcherId?: number;
  }>;
}) {
  return request<{ data: Array<{ id: number }> }>("/api/jobs/discover/batch", {
    method: "POST",
    body,
  });
}

export async function fetchBackendJobFeedWatchers() {
  return request<{
    data: Array<{
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
    }>;
  }>("/api/me/job-watchers");
}

export async function updateBackendJobFeedWatcherStatus(
  watcherId: number,
  body: { status: "active" | "paused" | "error"; lastError?: string },
) {
  return request<{ data: { id: number } }>(`/api/me/job-watchers/${watcherId}/status`, {
    method: "PUT",
    body,
  });
}
