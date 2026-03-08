import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchJobs } from "@/lib/api";

import { JobsManager } from "./jobs-manager";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  try {
    const jobs = await fetchJobs();

    return (
      <FeaturePageShell
        badge="Jobs Board"
        bullets={[
          "This is the user-facing jobs board, not a manual operator intake surface.",
          "All rows here should come from backend discovery or real ingestion flows.",
          "The board keeps one canonical job record while tracking multiple source platforms.",
          "Empty state is preferable to fake jobs because it tells us discovery is not wired yet.",
        ]}
        description="Review the complete board of discovered jobs. If the board stays empty, backend discovery is not yet producing real jobs from connected platforms."
        title="All discovered jobs in one board."
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
