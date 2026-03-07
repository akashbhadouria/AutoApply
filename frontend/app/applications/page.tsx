import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchApplications, fetchApplyAttempts, fetchJobs } from "@/lib/api";

import { ApplicationsManager } from "./applications-manager";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  try {
    const [applications, jobs, applyAttempts] = await Promise.all([
      fetchApplications(),
      fetchJobs(),
      fetchApplyAttempts({ limit: 30 }),
    ]);

    return (
      <FeaturePageShell
        badge="Phase 2 foundation"
        bullets={[
          "Application queue workers update one canonical status record per job.",
          "Successful referrals can suppress direct-apply automation.",
          "Browser sessions and notifications now hang off this canonical record.",
          "The dashboard funnel remains clean even when jobs come from multiple boards.",
        ]}
        description="This keeps one source of truth for application state and prevents duplicate trackers when the same job is discovered from multiple platforms."
        title="Application tracking tied directly to normalized jobs."
      >
        <ApplicationsManager initialApplications={applications} initialApplyAttempts={applyAttempts} jobs={jobs} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Phase 2 foundation"
        bullets={[
          "Applications join normalized jobs, so both datasets must be queryable.",
          "This page now fails gracefully instead of dropping into a raw error screen.",
          "The backend health endpoint is the first runtime check.",
          "The Docker-backed stack is the supported local path now.",
        ]}
        description="The applications tracker could not load its live data."
        title="Application tracking is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend health returns 200.",
            "GET /api/apply-attempts returns audit rows.",
            "Jobs and applications tables exist in the database.",
            "Workers are optional for viewing historical application records.",
            "Use npm run dev:stack if host Postgres credentials are inconsistent.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
