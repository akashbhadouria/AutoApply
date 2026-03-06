import { FeaturePageShell } from "@/components/page-shell";
import { fetchApplications, fetchJobs } from "@/lib/api";

import { ApplicationsManager } from "./applications-manager";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const [applications, jobs] = await Promise.all([fetchApplications(), fetchJobs()]);

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
      <ApplicationsManager initialApplications={applications} jobs={jobs} />
    </FeaturePageShell>
  );
}
