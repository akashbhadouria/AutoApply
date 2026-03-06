export interface ProfileField {
  key: string;
  label: string;
  value: string;
  valueType: string;
  source: "manual" | "learned" | "imported";
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

