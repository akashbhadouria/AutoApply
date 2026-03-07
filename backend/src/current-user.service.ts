import {
  connectedAccountSchema,
  currentUserSchema,
  jobFeedWatcherSchema,
  jobFeedWatcherStatusSchema,
  userJobPreferencesSchema,
} from "./current-user.schema.js";
import {
  createConnectedAccount,
  createJobDiscoveryEvent,
  createJobFeedWatcher,
  getJobFeedCursor,
  getCurrentUser,
  getUserJobPreferences,
  listActiveJobFeedWatchers,
  listConnectedAccounts,
  listJobDiscoveryEventsByWatcherId,
  listJobFeedWatchers,
  listRecentJobDiscoveryEventsByUserId,
  listWatcherActivitiesByUserId,
  markJobFeedWatcherRun,
  saveJobFeedCursor,
  saveCurrentUser,
  saveUserJobPreferences,
  updateJobFeedWatcherStatus,
} from "./current-user.repository.js";

export async function getOrCreateCurrentUser() {
  const existing = await getCurrentUser();
  if (existing) {
    return existing;
  }

  return saveCurrentUser({
    email: "founder@autoapply.dev",
    fullName: "AutoApply Founder",
    onboardingCompleted: false,
  });
}

export async function updateCurrentUser(payload: unknown) {
  const input = currentUserSchema.parse(payload);
  return saveCurrentUser(input);
}

export async function fetchCurrentUserPreferences() {
  const user = await getOrCreateCurrentUser();
  const preferences = await getUserJobPreferences(user.id);

  if (preferences) {
    return preferences;
  }

  return saveUserJobPreferences(user.id, {
    preferredRoles: ["Frontend Engineer", "React Developer"],
    preferredLocations: ["Bangalore", "Remote India"],
    remotePreference: "hybrid",
    referralPreference: "referral_first",
    instantApplyEnabled: true,
    blockedCompanies: [],
    targetApplicationsPerDay: 25,
    notificationChannels: ["dashboard", "telegram"],
  });
}

export async function updateCurrentUserPreferences(payload: unknown) {
  const user = await getOrCreateCurrentUser();
  const input = userJobPreferencesSchema.parse(payload);
  return saveUserJobPreferences(user.id, input);
}

export async function fetchConnectedAccounts() {
  const user = await getOrCreateCurrentUser();
  return listConnectedAccounts(user.id);
}

export async function addConnectedAccount(payload: unknown) {
  const user = await getOrCreateCurrentUser();
  const input = connectedAccountSchema.parse(payload);
  return createConnectedAccount(user.id, {
    provider: input.provider,
    accountLabel: input.accountLabel,
    connectionStatus: input.connectionStatus,
    approvalMode: input.approvalMode,
    accountIdentifier: input.accountIdentifier ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function fetchJobFeedWatchers() {
  const user = await getOrCreateCurrentUser();
  return listJobFeedWatchers(user.id);
}

export async function fetchJobWatcherActivities() {
  const user = await getOrCreateCurrentUser();
  return listWatcherActivitiesByUserId(user.id);
}

export async function fetchActiveJobFeedWatchers() {
  return listActiveJobFeedWatchers();
}

export async function addJobFeedWatcher(payload: unknown) {
  const user = await getOrCreateCurrentUser();
  const input = jobFeedWatcherSchema.parse(payload);
  return createJobFeedWatcher(user.id, {
    name: input.name,
    sourcePlatform: input.sourcePlatform,
    provider: input.provider,
    status: input.status,
    pollingIntervalSeconds: input.pollingIntervalSeconds,
    searchTitles: input.searchTitles,
    locations: input.locations,
    recencyDays: input.recencyDays,
    configuration: input.configuration ?? {},
  });
}

export async function changeJobFeedWatcherStatus(watcherId: string, payload: unknown) {
  const input = jobFeedWatcherStatusSchema.parse(payload);
  return updateJobFeedWatcherStatus(Number(watcherId), input);
}

export async function recordJobFeedWatcherRun(
  watcherId: number,
  input: { status: "active" | "paused" | "error"; lastError?: string; succeeded: boolean },
) {
  return markJobFeedWatcherRun(watcherId, input);
}

export async function fetchJobFeedCursor(watcherId: string) {
  return getJobFeedCursor(Number(watcherId));
}

export async function updateJobFeedCursor(
  watcherId: string,
  payload: { lastSeenJobId?: string | null; lastSeenTimestamp?: string | null },
) {
  return saveJobFeedCursor(Number(watcherId), payload);
}

export async function fetchJobDiscoveryEvents(watcherId: string) {
  return listJobDiscoveryEventsByWatcherId(Number(watcherId));
}

export async function fetchRecentJobDiscoveryEvents(input?: {
  limit?: string;
  eventType?: string;
}) {
  const user = await getOrCreateCurrentUser();
  const limit = Math.min(100, Math.max(1, Number(input?.limit ?? 25) || 25));
  const eventType =
    input?.eventType === "job_discovered" || input?.eventType === "fresh_job_detected"
      ? input.eventType
      : undefined;

  return listRecentJobDiscoveryEventsByUserId(user.id, {
    limit,
    eventType,
  });
}

export async function addJobDiscoveryEvent(
  watcherId: string,
  payload: { jobId?: number | null; eventType: "job_discovered" | "fresh_job_detected"; payload?: Record<string, unknown> },
) {
  return createJobDiscoveryEvent({
    watcherId: Number(watcherId),
    jobId: payload.jobId,
    eventType: payload.eventType,
    payload: payload.payload,
  });
}
