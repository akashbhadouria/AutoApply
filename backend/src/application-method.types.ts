export interface ApplicationMethodRecord {
  id: number;
  provider: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  supportsApiApply: boolean;
  supportsHttpFormApply: boolean;
  requiresBrowser: boolean;
  priorityRank: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
