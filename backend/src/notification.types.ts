export type NotificationChannel = "dashboard" | "email" | "telegram" | "whatsapp";
export type NotificationStatus = "pending" | "delivered" | "failed";

export interface NotificationRecord {
  id: number;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  relatedJobId: number | null;
  relatedReferralId: number | null;
  createdAt: string;
  deliveredAt: string | null;
}

