import { jobFeedPreviewSchema } from "./current-user.schema.js";

type PreviewProvider = "greenhouse" | "lever" | "generic_json" | "google_jobs";
type PreviewPlatform = "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";

interface PreviewJob {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  postedDate: string;
  sourcePlatform: PreviewPlatform;
}

function normalizeText(value: string | undefined | null) {
  return value?.trim().toLowerCase() ?? "";
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

function parseGreenhouseJobs(payload: unknown, input: { platform: PreviewPlatform; company?: string; name: string }): PreviewJob[] {
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
    const company = input.company ?? extractStringRecordValue(job, ["company_name"]) ?? input.name;
    const postedDate = normalizeIsoDate(
      extractStringRecordValue(job, ["updated_at", "created_at"]) ??
        (typeof job.updated_at === "number" ? job.updated_at : undefined),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [{ company, title, location, jobUrl, postedDate, sourcePlatform: input.platform }];
  });
}

function parseLeverJobs(payload: unknown, input: { platform: PreviewPlatform; company?: string; name: string }): PreviewJob[] {
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
    const company = input.company ?? extractStringRecordValue(job, ["company"]) ?? input.name;
    const postedDate = normalizeIsoDate(
      (typeof job.createdAt === "number" ? job.createdAt : undefined) ??
        extractStringRecordValue(job, ["createdAt", "updatedAt"]),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [{ company, title, location, jobUrl, postedDate, sourcePlatform: input.platform }];
  });
}

function parseGenericJsonJobs(payload: unknown, input: { platform: PreviewPlatform; company?: string; name: string }): PreviewJob[] {
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
    const company = input.company ?? extractStringRecordValue(job, ["company", "companyName"]) ?? input.name;
    const postedDate = normalizeIsoDate(
      extractStringRecordValue(job, ["postedDate", "createdAt", "updatedAt", "date"]) ??
        (typeof job.createdAt === "number" ? job.createdAt : undefined),
    );

    if (!title || !jobUrl || !location || !postedDate) {
      return [];
    }

    return [{ company, title, location, jobUrl, postedDate, sourcePlatform: input.platform }];
  });
}

function parseGoogleJobsJobs(payload: unknown, input: { platform: PreviewPlatform; company?: string; name: string }): PreviewJob[] {
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
      input.company ??
      extractStringRecordValue(job, ["company_name", "company", "employer_name"]) ??
      input.name;
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
        postedDate: normalizedPostedDate,
        sourcePlatform: input.platform,
      },
    ];
  });
}

function filterJobs(jobs: PreviewJob[], input: { searchTitles: string[]; locations: string[]; recencyDays: number }) {
  return jobs.filter(
    (job) =>
      matchesSearchTitles(job.title, input.searchTitles) &&
      matchesLocations(job.location, input.locations) &&
      isRecentEnough(job.postedDate, input.recencyDays),
  );
}

export async function previewJobFeed(payload: unknown) {
  const input = jobFeedPreviewSchema.parse(payload);
  const response = await fetch(input.url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AutoApplyFeedPreview/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Feed request failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  const context = {
    platform: input.sourcePlatform,
    company: input.company,
    name: input.company ?? input.provider,
  };

  let jobs: PreviewJob[] = [];

  switch (input.provider as PreviewProvider) {
    case "greenhouse":
      jobs = parseGreenhouseJobs(data, context);
      break;
    case "lever":
      jobs = parseLeverJobs(data, context);
      break;
    case "generic_json":
      jobs = parseGenericJsonJobs(data, context);
      break;
    case "google_jobs":
      jobs = parseGoogleJobsJobs(data, context);
      break;
  }

  const filtered = filterJobs(jobs, {
    searchTitles: input.searchTitles,
    locations: input.locations,
    recencyDays: input.recencyDays,
  });

  return {
    totalFetched: jobs.length,
    matchedCount: filtered.length,
    jobs: filtered.slice(0, 8),
  };
}
