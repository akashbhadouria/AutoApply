import {
  getApplicationBreakdown,
  getDashboardCounts,
  getFreshJobs,
  getLatestScannerRun,
  getRecentEvents,
  getRecentJobs,
  getReferralBreakdown,
} from "./dashboard.repository.js";
import type { DashboardSummary } from "./dashboard.types.js";
import { getServiceHealthSummary } from "./health.service.js";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [counts, applicationBreakdown, referralBreakdown, freshJobs, recentJobs, recentEvents, latestScannerRun, healthSummary] =
    await Promise.all([
      getDashboardCounts(),
      getApplicationBreakdown(),
      getReferralBreakdown(),
      getFreshJobs(),
      getRecentJobs(),
      getRecentEvents(),
      getLatestScannerRun(),
      getServiceHealthSummary(),
    ]);

  return {
    metrics: [
      { label: "Jobs tracked", value: counts.jobs, detail: "Normalized inventory across all sources." },
      { label: "Fresh jobs", value: counts.freshJobs, detail: "Fresh watcher-discovered jobs in the instant-response window." },
      { label: "Applications", value: counts.applications, detail: "Canonical application records linked to jobs." },
      { label: "Referrals", value: counts.referrals, detail: "Drafts and live outreach state." },
      { label: "Paused ATS sessions", value: counts.pausedSessions, detail: "Sessions waiting on data or resume." },
      { label: "Pending notifications", value: counts.notificationsPending, detail: "Events still waiting for delivery." },
      { label: "Field mappings", value: counts.fieldMappings, detail: "Learned ATS labels mapped to profile keys." },
    ],
    statuses: healthSummary.services,
    applicationBreakdown,
    referralBreakdown,
    freshJobs,
    recentJobs,
    recentEvents,
    latestScannerRun,
  };
}
