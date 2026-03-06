import { FeaturePageShell } from "@/components/page-shell";
import { fetchJobs } from "@/lib/api";

import { JobsManager } from "./jobs-manager";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
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
}
