export type SettingValueType = "string" | "boolean" | "number" | "json";

export interface SystemSettingRecord {
  key: string;
  label: string;
  value: string;
  valueType: SettingValueType;
  category: string;
  createdAt: string;
  updatedAt: string;
}
