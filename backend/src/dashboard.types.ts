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

export interface DashboardRecentJob {
  id: number;
  company: string;
  title: string;
  location: string;
  sourcePlatforms: string[];
  freshnessStatus: "fresh" | "recent" | "standard";
  jobPriority: "high" | "normal" | "low";
  applyStrategy: "api" | "http_form" | "browser";
  discoveredAt: string;
}

export interface DashboardRecentEvent {
  id: number;
  eventType: string;
  actor: string;
  createdAt: string;
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

export interface DashboardWatcherActivity {
  watcherId: number;
  name: string;
  status: "active" | "paused" | "error";
  provider: string;
  pollingIntervalSeconds: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastSeenTimestamp: string | null;
  recentDiscoveryCount: number;
  recentFreshCount: number;
}

export interface DashboardApplyAttempt {
  id: number;
  jobId: number;
  company: string;
  title: string;
  strategy: "api" | "http_form" | "browser";
  provider: string;
  status: "queued" | "submitted" | "failed" | "unsupported";
  durationMs: number | null;
  createdAt: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  statuses: DashboardStatus[];
  applicationBreakdown: Array<{ status: string; count: number }>;
  referralBreakdown: Array<{ status: string; count: number }>;
  freshJobs: DashboardRecentJob[];
  recentJobs: DashboardRecentJob[];
  recentEvents: DashboardRecentEvent[];
  latestScannerRun: DashboardScannerRun | null;
  watcherActivities: DashboardWatcherActivity[];
  recentApplyAttempts: DashboardApplyAttempt[];
}
