import { config as loadEnv } from "dotenv";

loadEnv();

export interface JobSourceFeedConfig {
  name: string;
  provider: "greenhouse" | "lever" | "generic_json";
  platform: "linkedin" | "instahyre" | "hirist" | "naukri" | "company_site";
  url: string;
  company?: string;
}

function parseJobSourceFeeds(rawValue: string | undefined): JobSourceFeedConfig[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.name !== "string" ||
        typeof entry.provider !== "string" ||
        typeof entry.platform !== "string" ||
        typeof entry.url !== "string"
      ) {
        return [];
      }

      if (
        (entry.provider !== "greenhouse" && entry.provider !== "lever" && entry.provider !== "generic_json") ||
        (entry.platform !== "linkedin" &&
          entry.platform !== "instahyre" &&
          entry.platform !== "hirist" &&
          entry.platform !== "naukri" &&
          entry.platform !== "company_site")
      ) {
        return [];
      }

      return [
        {
          name: entry.name,
          provider: entry.provider,
          platform: entry.platform,
          url: entry.url,
          company: typeof entry.company === "string" ? entry.company : undefined,
        } satisfies JobSourceFeedConfig,
      ];
    });
  } catch {
    return [];
  }
}

export const env = {
  backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
  emailWebhookUrl: process.env.EMAIL_WEBHOOK_URL,
  jobSourceFeeds: parseJobSourceFeeds(process.env.JOB_SOURCE_FEEDS_JSON),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  watcherSchedulerEnabled: process.env.WATCHER_SCHEDULER_ENABLED !== "false",
  watcherSchedulerTickMs: Number(process.env.WATCHER_SCHEDULER_TICK_MS ?? 15_000),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  whatsappWebhookUrl: process.env.WHATSAPP_WEBHOOK_URL,
};
