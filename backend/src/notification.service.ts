import { createNotificationSchema } from "./notification.schema.js";
import { createNotification, listNotifications } from "./notification.repository.js";

export async function getNotifications() {
  return listNotifications();
}

export async function saveNotification(payload: unknown) {
  const input = createNotificationSchema.parse(payload);
  return createNotification(input);
}

