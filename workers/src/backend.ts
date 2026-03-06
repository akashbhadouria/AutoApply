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
