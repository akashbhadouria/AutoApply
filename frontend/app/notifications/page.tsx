import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchJobs, fetchNotifications } from "@/lib/api";

import { NotificationsManager } from "./notifications-manager";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  try {
    const [notifications, jobs] = await Promise.all([fetchNotifications(), fetchJobs()]);

    return (
      <FeaturePageShell
        badge="Notifications hub"
        bullets={[
          "Notification delivery state now has its own dedicated page.",
          "Inbox actions can mark notifications delivered or failed without touching Operations.",
          "Channel-specific monitoring is separated from raw worker event history.",
          "This page complements the queue-driven notification worker instead of replacing it.",
        ]}
        description="This dedicated inbox keeps delivery state explicit across dashboard, email, Telegram, and WhatsApp notification channels."
        title="Channel delivery management for runtime alerts."
      >
        <NotificationsManager initialNotifications={notifications} jobs={jobs} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Notifications hub"
        bullets={[
          "This page depends on notifications and jobs being reachable from the backend.",
          "It preserves the shell even when the inbox data source is unavailable.",
          "Use the deterministic Docker stack to keep the runtime consistent.",
          "The notification worker can continue processing independently of this page.",
        ]}
        description="The dedicated notifications inbox could not fetch its live data."
        title="Notifications are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend responds on port 4000.",
            "The notifications table exists in the database.",
            "Use npm run dev:stack if local services drift.",
            "After recovery, this page should render inbox entries and status actions.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
