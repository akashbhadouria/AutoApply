export type ApplicationSessionStatus = "paused" | "ready_to_resume" | "completed";

export interface ApplicationSessionRecord {
  id: number;
  jobId: number;
  company: string;
  title: string;
  formUrl: string;
  filledFields: Record<string, string>;
  missingField: string;
  status: ApplicationSessionStatus;
  createdAt: string;
  updatedAt: string;
}

