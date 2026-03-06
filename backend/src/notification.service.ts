import { z } from "zod";

import { createNotificationSchema, updateNotificationStatusSchema } from "./notification.schema.js";
import { createNotification, listNotifications, updateNotificationStatus } from "./notification.repository.js";

export async function getNotifications() {
  return listNotifications();
}

export async function saveNotification(payload: unknown) {
  const input = createNotificationSchema.parse(payload);
  return createNotification(input);
}

export async function changeNotificationStatus(id: string, payload: unknown) {
  const normalizedId = z.coerce.number().int().positive().parse(id);
  const input = updateNotificationStatusSchema.parse(payload);
  return updateNotificationStatus(normalizedId, input);
}
