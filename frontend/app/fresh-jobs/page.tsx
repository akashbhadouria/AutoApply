import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchFreshJobs } from "@/lib/api";

import { FreshJobsManager } from "./fresh-jobs-manager";

export const dynamic = "force-dynamic";

export default async function FreshJobsPage() {
  try {
    const jobs = await fetchFreshJobs();

    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This is the operator-facing view of the instant-response window.",
          "Only jobs marked fresh by watchers appear here.",
          "Priority and apply strategy are visible at a glance.",
          "This page is the handoff surface between discovery and action.",
        ]}
        description="Review the jobs that entered the fresh high-priority window and decide whether to push referrals faster or let direct application continue."
        title="Fresh jobs in the high-priority application window."
      >
        <FreshJobsManager initialJobs={jobs} />
      </FeaturePageShell>
    );
  } catch (error) {
    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page depends on the fresh-jobs backend endpoint.",
          "The watcher worker must classify jobs as fresh for rows to appear.",
          "Use the automation page to enqueue job-feed-watcher manually.",
          "The runtime banner above should identify dependency failures.",
        ]}
        description="The fresh jobs surface is implemented, but the backend dataset could not be loaded."
        title="Fresh jobs are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/jobs/fresh returns data.",
            "job-feed-watcher has been enqueued at least once.",
            "database/schema.sql includes freshness columns on jobs.",
            "Make sure your discovery path is writing real jobs into the database.",
          ]}
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </FeaturePageShell>
    );
  }
}
