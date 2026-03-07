import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchJobFeedWatchers } from "@/lib/api";

import { JobWatchersManager } from "./job-watchers-manager";

export const dynamic = "force-dynamic";

export default async function JobWatchersPage() {
  try {
    const watchers = await fetchJobFeedWatchers();

    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "Watchers are the replacement for ad-hoc cron-only scanning.",
          "Each watcher belongs to the current user and stores its targeting rules.",
          "The watcher queue now exists alongside the older scanner worker.",
          "This is the first product surface for near-real-time discovery control.",
        ]}
        description="Create and manage user-level job watchers that define which titles and locations AutoApply should monitor continuously."
        title="Job watchers for near-real-time discovery."
      >
        <JobWatchersManager initialWatchers={watchers} />
      </FeaturePageShell>
    );
  } catch (error) {
    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page depends on the new job feed watcher model.",
          "Use it to set user-specific discovery rules instead of relying on one global scanner payload.",
          "The automation page can still enqueue watcher runs manually.",
          "The runtime banner above should show dependency health.",
        ]}
        description="The job watchers page is implemented, but watcher state could not be loaded."
        title="Job watchers are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/me/job-watchers returns watcher data.",
            "database/schema.sql has been applied.",
            "The backend is healthy and reachable.",
            "Use npm run dev:stack after schema changes.",
          ]}
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </FeaturePageShell>
    );
  }
}
