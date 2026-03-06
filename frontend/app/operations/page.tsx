import { Card } from "@/components/ui/card";
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
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Operations layer</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Notifications and paused application sessions with explicit operational state.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This is the first operational surface where browser workers, self-learning engines, and workflow automation can publish events and paused application state.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>ATS workers can pause cleanly when a field is missing</li>
            <li>Notification workflows can route events by channel and state</li>
            <li>User-facing resume links can point to concrete paused sessions</li>
            <li>n8n and worker queues now have stable write targets</li>
          </ul>
        </Card>
      </div>

      <OperationsManager
        initialSessions={sessions}
        initialNotifications={notifications}
        initialEvents={events}
        jobs={jobs}
      />
    </main>
  );
}
