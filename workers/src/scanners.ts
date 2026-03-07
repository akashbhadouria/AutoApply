import type { JobDiscoveryJobData } from "./contracts.js";

import { env, type JobSourceFeedConfig } from "./config.js";

interface ScannedJob {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  postedDate: string;
}

interface ScannerRunSource {
  name: string;
  provider: "deterministic" | "greenhouse" | "lever" | "generic_json" | "google_jobs";
  platform: ScannedJob["sourcePlatform"];
  mode: "live" | "fallback";
  discoveredCount: number;
  error?: string;
}

export interface ScannerRunResult {
  jobs: ScannedJob[];
  sources: ScannerRunSource[];
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function dateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function pickCompanies(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("react")) {
    return ["Razorpay", "Groww", "PhonePe"];
  }

  if (normalized.includes("ui")) {
    return ["Swiggy", "Myntra", "CRED"];
  }

  return ["Flipkart", "Meesho", "Zeta"];
}

function buildDeterministicJobsForSource(
  sourcePlatform: ScannedJob["sourcePlatform"],
  payload: JobDiscoveryJobData,
): ScannedJob[] {
  return payload.searchTitles.flatMap((title, titleIndex) => {
    const companies = pickCompanies(title);

    return payload.locations.flatMap((location, locationIndex) =>
      companies.map((company, companyIndex) => ({
        company,
        title,
        location,
        sourcePlatform,
        postedDate: dateDaysAgo((titleIndex + locationIndex + companyIndex) % Math.max(payload.recencyDays, 1)),
        jobUrl: `https://${sourcePlatform}.example.com/jobs/${slugify(company)}/${slugify(title)}/${slugify(location)}`,
      })),
    );
  });
}

function normalizeText(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesSearchTitles(title: string, searchTitles: string[]) {
  const normalizedTitle = normalizeText(title);
  return searchTitles.some((searchTitle) => {
    const normalizedSearchTitle = normalizeText(searchTitle);
    return normalizedTitle.includes(normalizedSearchTitle) || normalizedSearchTitle.includes(normalizedTitle);
  });
}

function matchesLocations(location: string, requestedLocations: string[]) {
  const normalizedLocation = normalizeText(location);
  return requestedLocations.some((requestedLocation) => {
    const normalizedRequested = normalizeText(requestedLocation);
    return (
      normalizedLocation.includes(normalizedRequested) ||
      normalizedRequested.includes(normalizedLocation) ||
      (normalizedRequested.includes("remote") && normalizedLocation.includes("remote"))
    );
  });
}

function isRecentEnough(postedDate: string, recencyDays: number) {
  const parsed = Date.parse(postedDate);
  if (Number.isNaN(parsed)) {
    return false;
  }

  const threshold = new Date();
  threshold.setUTCDate(threshold.getUTCDate() - Math.max(recencyDays, 1));
  return parsed >= threshold.getTime();
}

function normalizeIsoDate(value: string | number | undefined | null) {
  if (value === undefined || value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? new Date(value) : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function extractStringRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function parseGreenhouseJobs(payload: unknown, feed: JobSourceFeedConfig): ScannedJob[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { jobs?: unknown[] }).jobs)) {
    return [];
  }

  return (payload as { jobs: Array<Record<string, unknown>> }).jobs.flatMap((job) => {
    const title = extractStringRecordValue(job, ["title"]);
    const jobUrl = extractStringRecordValue(job, ["absolute_url", "url"]);
    const locationValue = job.location;
    const location =
      locationValue && typeof locationValue === "object" && typeof (locationValue as { name?: unknown }).name === "string"
        ? String((locationValue as { name: string }).name)
        : extractStringRecordValue(job, ["location"]);
    const company = feed.company ?? extractStringRecordValue(job, ["company_name"]) ?? feed.name;
    const postedDate = normalizeIsoDate(
      extractStringRecordValue(job, ["updated_at", "created_at"]) ??
        (typeof job.updated_at === "number" ? job.updated_at : undefined),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [
      {
        company,
        title,
        location,
        jobUrl,
        sourcePlatform: feed.platform,
        postedDate,
      } satisfies ScannedJob,
    ];
  });
}

function parseLeverJobs(payload: unknown, feed: JobSourceFeedConfig): ScannedJob[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const job = entry as Record<string, unknown>;
    const categories = job.categories && typeof job.categories === "object" ? (job.categories as Record<string, unknown>) : null;
    const title = extractStringRecordValue(job, ["text", "title"]);
    const jobUrl = extractStringRecordValue(job, ["hostedUrl", "applyUrl", "url"]);
    const location =
      (categories && extractStringRecordValue(categories, ["location", "team"])) || extractStringRecordValue(job, ["location"]);
    const company = feed.company ?? extractStringRecordValue(job, ["company"]) ?? feed.name;
    const postedDate = normalizeIsoDate(
      (typeof job.createdAt === "number" ? job.createdAt : undefined) ??
        extractStringRecordValue(job, ["createdAt", "updatedAt"]),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [
      {
        company,
        title,
        location,
        jobUrl,
        sourcePlatform: feed.platform,
        postedDate,
      } satisfies ScannedJob,
    ];
  });
}

function parseGenericJsonJobs(payload: unknown, feed: JobSourceFeedConfig): ScannedJob[] {
  const items = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { jobs?: unknown[] }).jobs)
      ? (payload as { jobs: unknown[] }).jobs
      : payload && typeof payload === "object" && Array.isArray((payload as { items?: unknown[] }).items)
        ? (payload as { items: unknown[] }).items
        : [];

  return items.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const job = entry as Record<string, unknown>;
    const title = extractStringRecordValue(job, ["title", "text", "role", "name"]);
    const jobUrl = extractStringRecordValue(job, ["jobUrl", "url", "applyUrl", "absolute_url", "hostedUrl"]);
    const location = extractStringRecordValue(job, ["location", "city", "place"]);
    const company = feed.company ?? extractStringRecordValue(job, ["company", "companyName"]) ?? feed.name;
    const postedDate = normalizeIsoDate(
      extractStringRecordValue(job, ["postedDate", "createdAt", "updatedAt", "date"]) ??
        (typeof job.createdAt === "number" ? job.createdAt : undefined),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [
      {
        company,
        title,
        location,
        jobUrl,
        sourcePlatform: feed.platform,
        postedDate,
      } satisfies ScannedJob,
    ];
  });
}

function parseGoogleJobsJobs(payload: unknown, feed: JobSourceFeedConfig): ScannedJob[] {
  const items =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { jobs_results?: unknown[] }).jobs_results)
      ? (payload as { jobs_results: unknown[] }).jobs_results
      : payload &&
          typeof payload === "object" &&
          Array.isArray((payload as { jobs?: unknown[] }).jobs)
        ? (payload as { jobs: unknown[] }).jobs
        : [];

  return items.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const job = entry as Record<string, unknown>;
    const title = extractStringRecordValue(job, ["title", "job_title", "position"]);
    const jobUrl = extractStringRecordValue(job, ["jobUrl", "apply_link", "apply_options", "related_links"]);
    const location = extractStringRecordValue(job, ["location", "detected_extensions", "job_location"]);
    const company =
      feed.company ??
      extractStringRecordValue(job, ["company_name", "company", "employer_name"]) ??
      feed.name;
    const postedDate = normalizeIsoDate(
      extractStringRecordValue(job, ["detected_extensions", "posted_at", "postedDate", "date"]) ??
        (typeof job.timestamp === "number" ? job.timestamp : undefined),
    );

    const normalizedUrl =
      typeof job.apply_options === "string"
        ? job.apply_options
        : Array.isArray(job.apply_options) && job.apply_options[0] && typeof job.apply_options[0] === "object"
          ? extractStringRecordValue(job.apply_options[0] as Record<string, unknown>, ["link", "url"])
          : Array.isArray(job.related_links) && job.related_links[0] && typeof job.related_links[0] === "object"
            ? extractStringRecordValue(job.related_links[0] as Record<string, unknown>, ["link", "url"])
            : jobUrl;

    const normalizedLocation =
      typeof job.detected_extensions === "object" && job.detected_extensions
        ? extractStringRecordValue(job.detected_extensions as Record<string, unknown>, ["location"])
        : location;
    const normalizedPostedDate =
      typeof job.detected_extensions === "object" && job.detected_extensions
        ? normalizeIsoDate(
            extractStringRecordValue(job.detected_extensions as Record<string, unknown>, ["posted_at", "schedule_type"]) ??
              postedDate,
          )
        : postedDate;

    if (!title || !normalizedUrl || !normalizedLocation || !normalizedPostedDate) {
      return [];
    }

    return [
      {
        company,
        title,
        location: normalizedLocation,
        jobUrl: normalizedUrl,
        sourcePlatform: feed.platform,
        postedDate: normalizedPostedDate,
      } satisfies ScannedJob,
    ];
  });
}

async function fetchLiveFeedJobs(feed: JobSourceFeedConfig): Promise<ScannedJob[]> {
  const response = await fetch(feed.url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AutoApplyJobScanner/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  switch (feed.provider) {
    case "greenhouse":
      return parseGreenhouseJobs(payload, feed);
    case "lever":
      return parseLeverJobs(payload, feed);
    case "generic_json":
      return parseGenericJsonJobs(payload, feed);
    case "google_jobs":
      return parseGoogleJobsJobs(payload, feed);
    default:
      return [];
  }
}

function filterJobsForQuery(jobs: ScannedJob[], payload: JobDiscoveryJobData) {
  return jobs.filter((job) => {
    const parsedPostedAt = Date.parse(job.postedDate);
    const parsedCursor = payload.lastSeenTimestamp ? Date.parse(payload.lastSeenTimestamp) : NaN;

    return (
      matchesSearchTitles(job.title, payload.searchTitles) &&
      matchesLocations(job.location, payload.locations) &&
      isRecentEnough(job.postedDate, payload.recencyDays) &&
      (Number.isNaN(parsedCursor) || (!Number.isNaN(parsedPostedAt) && parsedPostedAt > parsedCursor))
    );
  });
}

function buildFallbackResult(payload: JobDiscoveryJobData): ScannerRunResult {
  const deterministicJobs = [
    ...buildDeterministicJobsForSource("linkedin", payload),
    ...buildDeterministicJobsForSource("instahyre", payload),
    ...buildDeterministicJobsForSource("company_site", payload),
  ].slice(0, 18);

  return {
    jobs: deterministicJobs,
    sources: [
      {
        name: "deterministic-linkedin",
        provider: "deterministic",
        platform: "linkedin",
        mode: "fallback",
        discoveredCount: deterministicJobs.filter((job) => job.sourcePlatform === "linkedin").length,
      },
      {
        name: "deterministic-instahyre",
        provider: "deterministic",
        platform: "instahyre",
        mode: "fallback",
        discoveredCount: deterministicJobs.filter((job) => job.sourcePlatform === "instahyre").length,
      },
      {
        name: "deterministic-company-site",
        provider: "deterministic",
        platform: "company_site",
        mode: "fallback",
        discoveredCount: deterministicJobs.filter((job) => job.sourcePlatform === "company_site").length,
      },
    ],
  };
}

export async function scanDiscoveredJobs(payload: JobDiscoveryJobData): Promise<ScannerRunResult> {
  if (env.jobSourceFeeds.length === 0) {
    return buildFallbackResult(payload);
  }

  const liveResults = await Promise.all(
    env.jobSourceFeeds.map(async (feed) => {
      try {
        const discoveredJobs = filterJobsForQuery(await fetchLiveFeedJobs(feed), payload);
        return {
          jobs: discoveredJobs,
          source: {
            name: feed.name,
            provider: feed.provider,
            platform: feed.platform,
            mode: "live",
            discoveredCount: discoveredJobs.length,
          } satisfies ScannerRunSource,
        };
      } catch (error) {
        return {
          jobs: [] as ScannedJob[],
          source: {
            name: feed.name,
            provider: feed.provider,
            platform: feed.platform,
            mode: "live",
            discoveredCount: 0,
            error: error instanceof Error ? error.message : "Unknown feed error",
          } satisfies ScannerRunSource,
        };
      }
    }),
  );

  const liveJobs = liveResults.flatMap((result) => result.jobs);
  const liveSources = liveResults.map((result) => result.source);

  if (liveJobs.length > 0) {
    return {
      jobs: liveJobs.slice(0, 50),
      sources: liveSources,
    };
  }

  const fallback = buildFallbackResult(payload);
  return {
    jobs: fallback.jobs,
    sources: [...liveSources, ...fallback.sources],
  };
}
