export interface EventRecord {
  id: number;
  eventType: string;
  actor: string;
  payload: Record<string, unknown>;
  relatedJobId: number | null;
  createdAt: string;
}

