export type SourcePlatform = "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";

export interface JobRecord {
  id: number;
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  primarySourcePlatform: SourcePlatform;
  sourcePlatforms: SourcePlatform[];
  postedDate: string | null;
  firstSeenAt: string;
  freshnessStatus: "fresh" | "recent" | "standard";
  jobPriority: "high" | "normal" | "low";
  applyStrategy: "api" | "http_form" | "browser";
  applyProvider: string;
  discoveredByWatcherId: number | null;
  discoveredAt: string;
  updatedAt: string;
}
