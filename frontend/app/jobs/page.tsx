import { Card } from "@/components/ui/card";
import { fetchJobs } from "@/lib/api";

import { JobsManager } from "./jobs-manager";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await fetchJobs();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Phase 2 foundation</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            A normalized jobs inventory with duplicate detection and platform merging.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This page exercises the same ingestion path the future scanner workers will use. If the same job appears from LinkedIn and Instahyre, the system keeps one job record and tracks both sources.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>Automated scanners can safely upsert without creating duplicates</li>
            <li>Referral workflows can operate against one canonical job record</li>
            <li>Application queueing can prioritize normalized jobs instead of raw scraper output</li>
            <li>Source analytics can show where the same role was discovered</li>
          </ul>
        </Card>
      </div>

      <JobsManager initialJobs={jobs} />
    </main>
  );
}
