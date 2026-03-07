export interface ApplyAttemptRecord {
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
}

export interface ApplyAttemptListRecord extends ApplyAttemptRecord {
  company: string;
  title: string;
}
