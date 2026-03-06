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
  discoveredAt: string;
}

export interface DashboardRecentEvent {
  id: number;
  eventType: string;
  actor: string;
  createdAt: string;
}

export interface DashboardSummary {
  metrics: DashboardMetric[];
  statuses: DashboardStatus[];
  applicationBreakdown: Array<{ status: string; count: number }>;
  referralBreakdown: Array<{ status: string; count: number }>;
  recentJobs: DashboardRecentJob[];
  recentEvents: DashboardRecentEvent[];
}
