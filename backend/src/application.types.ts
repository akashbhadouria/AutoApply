import type { SourcePlatform } from "./job.types.js";

export type ApplicationStatus = "pending" | "applied" | "interview" | "rejected" | "offer";

export interface ApplicationRecord {
  id: number;
  jobId: number;
  company: string;
  title: string;
  location: string;
  sourcePlatform: SourcePlatform;
  applied: boolean;
  appliedDate: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRateWindowSnapshot {
  appliedCount: number;
  oldestAppliedAt: string | null;
}
