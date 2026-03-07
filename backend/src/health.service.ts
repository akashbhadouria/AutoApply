import { queueRegistry } from "./automation.queue.js";
import { pool } from "./db.js";
import type { DashboardStatus } from "./dashboard.types.js";

async function getDatabaseStatus(): Promise<DashboardStatus> {
  try {
    await pool.query("SELECT 1");
    return {
      label: "PostgreSQL",
      status: "healthy",
      detail: "Primary persistence is reachable.",
    };
  } catch {
    return {
      label: "PostgreSQL",
      status: "degraded",
      detail: "The backend cannot query the primary database.",
    };
  }
}

async function getRedisStatus(): Promise<DashboardStatus> {
  try {
    const queue = queueRegistry["job-scanner"];
    const client = await queue.client;
    const result = await client.ping();

    return {
      label: "Redis",
      status: result === "PONG" ? "healthy" : "degraded",
      detail: result === "PONG" ? "BullMQ can reach Redis." : "Unexpected ping response from Redis.",
    };
  } catch {
    return {
      label: "Redis",
      status: "degraded",
      detail: "Queue storage is not reachable.",
    };
  }
}

export interface ServiceHealthSummary {
  status: "ok" | "degraded";
  services: DashboardStatus[];
}

export async function getServiceHealthSummary(): Promise<ServiceHealthSummary> {
  const services: DashboardStatus[] = [
    {
      label: "Backend",
      status: "healthy",
      detail: "Express API is serving health requests.",
    },
    await getDatabaseStatus(),
    await getRedisStatus(),
  ];

  return {
    status: services.every((service) => service.status === "healthy") ? "ok" : "degraded",
    services,
  };
}
