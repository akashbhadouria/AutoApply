export interface FieldMappingRecord {
  id: number;
  rawLabel: string;
  normalizedLabel: string;
  profileKey: string;
  confidence: "manual" | "learned" | "suggested";
  createdAt: string;
  updatedAt: string;
}

