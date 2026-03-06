export type ReferralStatus = "pending" | "replied" | "referred" | "no_response";

export interface ReferralRecord {
  id: number;
  jobId: number;
  contactId: number;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  status: ReferralStatus;
  outreachMessage: string;
  connectionRequestMessage: string | null;
  messageSentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

