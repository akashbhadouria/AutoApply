import type { SourcePlatform } from "./job.types.js";

export interface ContactRecord {
  id: number;
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl: string | null;
  email: string | null;
  sourcePlatform: SourcePlatform;
  createdAt: string;
  updatedAt: string;
}

