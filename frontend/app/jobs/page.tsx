import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchJobs } from "@/lib/api";

import { JobsManager } from "./jobs-manager";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  try {
    const jobs = await fetchJobs();

    return (
      <FeaturePageShell
        badge="Phase 2 foundation"
        bullets={[
          "Automated scanners can safely upsert without fragmenting the same role.",
          "Source analytics remain attached to one canonical job identity.",
          "Referral and application workers now consume normalized job records.",
          "The queue-driven scanner already writes into this page's data model.",
        ]}
        description="This page exercises the same ingestion path the future scanner workers will use. If the same job appears from LinkedIn and Instahyre, the system keeps one job record and tracks both sources."
        title="A normalized jobs inventory with duplicate detection and platform merging."
      >
        <JobsManager initialJobs={jobs} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Phase 2 foundation"
        bullets={[
          "Jobs are a DB-backed feature and will fail if Postgres cannot be queried.",
          "The scanner workers depend on this same storage contract.",
          "This view now stays styled even when the data layer is down.",
          "Use the one-command dev stack for a known-good local runtime.",
        ]}
        description="The jobs inventory page is implemented, but its live dataset could not be loaded."
        title="Jobs inventory is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend API routes are reachable.",
            "Database schema has been applied successfully.",
            "If host services are inconsistent, use npm run dev:stack.",
            "After recovery, this page should show an empty state or ingested jobs rather than crash.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
