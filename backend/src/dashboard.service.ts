import { queueRegistry } from "./automation.queue.js";
import { pool } from "./db.js";
import {
  getApplicationBreakdown,
  getDashboardCounts,
  getRecentEvents,
  getRecentJobs,
  getReferralBreakdown,
} from "./dashboard.repository.js";
import type { DashboardSummary } from "./dashboard.types.js";

async function getDatabaseStatus() {
  try {
    await pool.query("SELECT 1");
    return {
      label: "PostgreSQL",
      status: "healthy" as const,
      detail: "Primary persistence is reachable.",
    };
  } catch {
    return {
      label: "PostgreSQL",
      status: "degraded" as const,
      detail: "The backend cannot query the primary database.",
    };
  }
}

async function getRedisStatus() {
  try {
    const queue = queueRegistry["job-scanner"];
    const client = await queue.client;
    const result = await client.ping();

    return {
      label: "Redis",
      status: result === "PONG" ? ("healthy" as const) : ("degraded" as const),
      detail: result === "PONG" ? "BullMQ can reach Redis." : "Unexpected ping response from Redis.",
    };
  } catch {
    return {
      label: "Redis",
      status: "degraded" as const,
      detail: "Queue storage is not reachable.",
    };
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [counts, applicationBreakdown, referralBreakdown, recentJobs, recentEvents, databaseStatus, redisStatus] =
    await Promise.all([
      getDashboardCounts(),
      getApplicationBreakdown(),
      getReferralBreakdown(),
      getRecentJobs(),
      getRecentEvents(),
      getDatabaseStatus(),
      getRedisStatus(),
    ]);

  return {
    metrics: [
      { label: "Jobs tracked", value: counts.jobs, detail: "Normalized inventory across all sources." },
      { label: "Applications", value: counts.applications, detail: "Canonical application records linked to jobs." },
      { label: "Referrals", value: counts.referrals, detail: "Drafts and live outreach state." },
      { label: "Paused ATS sessions", value: counts.pausedSessions, detail: "Sessions waiting on data or resume." },
      { label: "Pending notifications", value: counts.notificationsPending, detail: "Events still waiting for delivery." },
      { label: "Field mappings", value: counts.fieldMappings, detail: "Learned ATS labels mapped to profile keys." },
    ],
    statuses: [
      {
        label: "Backend",
        status: "healthy",
        detail: "Express API is serving dashboard requests.",
      },
      databaseStatus,
      redisStatus,
    ],
    applicationBreakdown,
    referralBreakdown,
    recentJobs,
    recentEvents,
  };
}
