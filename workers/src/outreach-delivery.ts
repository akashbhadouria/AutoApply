import { env } from "./config.js";

interface OutreachPayload {
  id: number;
  channel: "linkedin" | "email" | "telegram" | "whatsapp";
  messageSubject: string | null;
  messageBody: string;
  company: string;
  jobTitle: string;
  contactName: string;
  contactRole: string;
  connectedAccountLabel: string | null;
  connectedAccountProvider: "linkedin" | "gmail" | "outlook" | "telegram" | "whatsapp" | null;
}

interface OutreachDeliveryResult {
  mode: "simulated" | "live";
  transport: string;
  externalReference?: string;
}

function buildOutreachText(attempt: OutreachPayload) {
  return [
    attempt.messageSubject ?? `${attempt.company} · ${attempt.jobTitle}`,
    "",
    attempt.messageBody,
    "",
    `Contact: ${attempt.contactName}${attempt.contactRole ? ` (${attempt.contactRole})` : ""}`,
    `Outreach Attempt ID: ${attempt.id}`,
  ].join("\n");
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

export function getOutreachTransportStatus(channel: OutreachPayload["channel"]) {
  if (channel === "linkedin") {
    return {
      configured: false,
      transport: "manual_linkedin_review",
    };
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

export async function deliverOutreachAttempt(attempt: OutreachPayload): Promise<OutreachDeliveryResult> {
  if (attempt.channel === "linkedin") {
    return {
      mode: "simulated",
      transport: "manual_linkedin_review",
    };
  }

  if (attempt.channel === "telegram") {
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
        text: buildOutreachText(attempt),
      }),
    });

    if (!response.ok) {
      throw new Error(`telegram_outreach_failed:${response.status}`);
    }

    return {
      mode: "live",
      transport: "telegram_bot_api",
      externalReference: `telegram:${attempt.id}`,
    };
  }

  if (attempt.channel === "email") {
    if (!env.emailWebhookUrl) {
      throw new Error("email_transport_unconfigured");
    }

    await postJson(env.emailWebhookUrl, {
      channel: attempt.channel,
      outreachAttemptId: attempt.id,
      subject: attempt.messageSubject ?? `${attempt.company} · ${attempt.jobTitle}`,
      message: attempt.messageBody,
      company: attempt.company,
      jobTitle: attempt.jobTitle,
      contactName: attempt.contactName,
      connectedAccountLabel: attempt.connectedAccountLabel,
    });

    return {
      mode: "live",
      transport: "email_webhook",
      externalReference: `email:${attempt.id}`,
    };
  }

  if (!env.whatsappWebhookUrl) {
    throw new Error("whatsapp_transport_unconfigured");
  }

  await postJson(env.whatsappWebhookUrl, {
    channel: attempt.channel,
    outreachAttemptId: attempt.id,
    title: attempt.messageSubject ?? `${attempt.company} · ${attempt.jobTitle}`,
    message: attempt.messageBody,
    company: attempt.company,
    jobTitle: attempt.jobTitle,
    contactName: attempt.contactName,
    connectedAccountLabel: attempt.connectedAccountLabel,
  });

  return {
    mode: "live",
    transport: "whatsapp_webhook",
    externalReference: `whatsapp:${attempt.id}`,
  };
}
