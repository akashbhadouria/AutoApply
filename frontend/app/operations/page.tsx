import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchApplicationSessions, fetchEvents, fetchJobs, fetchNotifications } from "@/lib/api";

import { OperationsManager } from "./operations-manager";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Operations layer"
        bullets={[
          "This page aggregates multiple backend-backed datasets at once.",
          "Paused sessions, notifications, and events are all persisted server-side.",
          "The UI now preserves structure when runtime dependencies fail.",
          "Use the one-command launcher to start the supported local stack.",
        ]}
        description="The operations layer could not fetch its live data."
        title="Operations data is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend health returns 200.",
            "The database schema includes notifications, events, and application_sessions.",
            "Workers are only needed to produce new runtime events, not to view the page.",
            "Use npm run dev:stack for a deterministic local environment.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
