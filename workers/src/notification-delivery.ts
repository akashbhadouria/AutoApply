import { env } from "./config.js";

interface NotificationPayload {
  id: number;
  type: string;
  title: string;
  message: string;
  channel: "dashboard" | "email" | "telegram" | "whatsapp";
  status: "pending" | "delivered" | "failed";
  deliveredAt: string | null;
}

interface NotificationDeliveryResult {
  mode: "simulated" | "live";
  transport: string;
}

function buildNotificationText(notification: NotificationPayload) {
  return `${notification.title}\n\n${notification.message}\n\nType: ${notification.type}\nNotification ID: ${notification.id}`;
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

export function getNotificationTransportStatus(channel: NotificationPayload["channel"]) {
  if (channel === "dashboard") {
    return { configured: true, transport: "dashboard" };
  }

  if (channel === "telegram") {
    return {
      configured: Boolean(env.telegramBotToken && env.telegramChatId),
      transport: "telegram_bot_api",
    };
  }

  if (channel === "email") {
    return {
      configured: Boolean(env.emailWebhookUrl),
      transport: "email_webhook",
    };
  }

  return {
    configured: Boolean(env.whatsappWebhookUrl),
    transport: "whatsapp_webhook",
  };
}

export async function deliverNotification(notification: NotificationPayload): Promise<NotificationDeliveryResult> {
  if (notification.channel === "dashboard") {
    return {
      mode: "simulated",
      transport: "dashboard",
    };
  }

  if (notification.channel === "telegram") {
    if (!env.telegramBotToken || !env.telegramChatId) {
      throw new Error("telegram_transport_unconfigured");
    }

    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: env.telegramChatId,
        text: buildNotificationText(notification),
      }),
    });

    if (!response.ok) {
      throw new Error(`telegram_delivery_failed:${response.status}`);
    }

    return {
      mode: "live",
      transport: "telegram_bot_api",
    };
  }

  if (notification.channel === "email") {
    if (!env.emailWebhookUrl) {
      throw new Error("email_transport_unconfigured");
    }

    await postJson(env.emailWebhookUrl, {
      channel: notification.channel,
      notificationId: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });

    return {
      mode: "live",
      transport: "email_webhook",
    };
  }

  if (!env.whatsappWebhookUrl) {
    throw new Error("whatsapp_transport_unconfigured");
  }

  await postJson(env.whatsappWebhookUrl, {
    channel: notification.channel,
    notificationId: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
  });

  return {
    mode: "live",
    transport: "whatsapp_webhook",
  };
}
