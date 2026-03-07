export interface OutreachAttemptRecord {
  id: number;
  referralId: number;
  connectedAccountId: number | null;
  channel: "linkedin" | "email" | "telegram" | "whatsapp";
  approvalStatus: "pending_approval" | "approved" | "rejected" | "not_required";
  executionStatus: "drafted" | "queued" | "sent" | "failed" | "cancelled";
  messageSubject: string | null;
  messageBody: string;
  externalReference: string | null;
  errorMessage: string | null;
  requestedAt: string;
  approvedAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachAttemptListRecord extends OutreachAttemptRecord {
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  connectedAccountLabel: string | null;
  connectedAccountProvider: "linkedin" | "gmail" | "outlook" | "telegram" | "whatsapp" | null;
}
