export interface ProfileField {
  key: string;
  label: string;
  value: string;
  valueType: string;
  source: "manual" | "learned" | "imported";
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: number;
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  primarySourcePlatform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  sourcePlatforms: Array<"linkedin" | "instahyre" | "hirist" | "naukri" | "company_site">;
  postedDate: string | null;
  discoveredAt: string;
  updatedAt: string;
}

export interface Application {
  id: number;
  jobId: number;
  company: string;
  title: string;
  location: string;
  sourcePlatform: Job["primarySourcePlatform"];
  applied: boolean;
  appliedDate: string | null;
  status: "pending" | "applied" | "interview" | "rejected" | "offer";
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl: string | null;
  email: string | null;
  sourcePlatform: Job["primarySourcePlatform"];
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: number;
  jobId: number;
  contactId: number;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  status: "pending" | "replied" | "referred" | "no_response";
  outreachMessage: string;
  connectionRequestMessage: string | null;
  messageSentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const backendUrl = process.env.BACKEND_URL;

function getBackendUrl() {
  if (!backendUrl) {
    throw new Error("BACKEND_URL is not configured");
  }

  return backendUrl;
}

export async function fetchProfileFields(): Promise<ProfileField[]> {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load profile fields");
  }

  const payload = (await response.json()) as { data: ProfileField[] };
  return payload.data;
}

export async function upsertProfileField(key: string, body: { label: string; value: string; source: ProfileField["source"] }) {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save profile field");
  }

  return response.json();
}

export async function removeProfileField(key: string) {
  const response = await fetch(`${getBackendUrl()}/api/profile-fields/${key}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete profile field");
  }
}

export async function fetchJobs(): Promise<Job[]> {
  const response = await fetch(`${getBackendUrl()}/api/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  const payload = (await response.json()) as { data: Job[] };
  return payload.data;
}

export async function discoverJob(body: {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  sourcePlatform: Job["primarySourcePlatform"];
  postedDate?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/jobs/discover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to ingest job");
  }

  return response.json();
}

export async function fetchApplications(): Promise<Application[]> {
  const response = await fetch(`${getBackendUrl()}/api/applications`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load applications");
  }

  const payload = (await response.json()) as { data: Application[] };
  return payload.data;
}

export async function upsertApplication(body: {
  jobId: number;
  sourcePlatform: Job["primarySourcePlatform"];
  applied: boolean;
  appliedDate?: string;
  status: Application["status"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save application");
  }

  return response.json();
}

export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetch(`${getBackendUrl()}/api/contacts`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load contacts");
  }

  const payload = (await response.json()) as { data: Contact[] };
  return payload.data;
}

export async function createContact(body: {
  company: string;
  fullName: string;
  firstName: string;
  title: string;
  profileUrl?: string;
  email?: string;
  sourcePlatform: Job["primarySourcePlatform"];
}) {
  const response = await fetch(`${getBackendUrl()}/api/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save contact");
  }

  return response.json();
}

export async function fetchReferrals(): Promise<Referral[]> {
  const response = await fetch(`${getBackendUrl()}/api/referrals`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load referrals");
  }

  const payload = (await response.json()) as { data: Referral[] };
  return payload.data;
}

export async function upsertReferral(body: {
  jobId: number;
  contactId: number;
  status: Referral["status"];
  outreachMessage: string;
  connectionRequestMessage?: string;
  messageSentAt?: string;
  repliedAt?: string;
}) {
  const response = await fetch(`${getBackendUrl()}/api/referrals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to save referral");
  }

  return response.json();
}
