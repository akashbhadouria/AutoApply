import type { JobDiscoveryJobData } from "./contracts.js";

interface ScannedJob {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  sourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  postedDate: string;
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

function buildJobsForSource(
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

export function scanDiscoveredJobs(payload: JobDiscoveryJobData): ScannedJob[] {
  const allJobs = [
    ...buildJobsForSource("linkedin", payload),
    ...buildJobsForSource("instahyre", payload),
    ...buildJobsForSource("company_site", payload),
  ];

  return allJobs.slice(0, 18);
}
