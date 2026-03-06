export type ProfileFieldSource = "manual" | "learned" | "imported";

export interface ProfileFieldRecord {
  key: string;
  label: string;
  value: string;
  valueType: string;
  source: ProfileFieldSource;
  createdAt: string;
  updatedAt: string;
}

