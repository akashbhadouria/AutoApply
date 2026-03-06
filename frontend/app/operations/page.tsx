import { FeaturePageShell } from "@/components/page-shell";
import { fetchApplicationSessions, fetchEvents, fetchJobs, fetchNotifications } from "@/lib/api";

import { OperationsManager } from "./operations-manager";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const [sessions, notifications, events, jobs] = await Promise.all([
    fetchApplicationSessions(),
    fetchNotifications(),
    fetchEvents(),
    fetchJobs(),
  ]);

  return (
    <FeaturePageShell
      badge="Operations layer"
      bullets={[
        "ATS workers can pause cleanly when a field is missing.",
        "Notification workflows can route events by channel and delivery state.",
        "The event stream exposes queue-driven side effects in one place.",
        "Resume links can point to concrete paused sessions instead of ad hoc notes.",
      ]}
      description="This is the first operational surface where browser workers, self-learning engines, and workflow automation can publish events and paused application state."
      title="Notifications and paused application sessions with explicit state."
    >
      <OperationsManager
        initialSessions={sessions}
        initialNotifications={notifications}
        initialEvents={events}
        jobs={jobs}
      />
    </FeaturePageShell>
  );
}
