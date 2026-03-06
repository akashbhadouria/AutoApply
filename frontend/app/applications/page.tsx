import { Card } from "@/components/ui/card";
import { fetchApplications, fetchJobs } from "@/lib/api";

import { ApplicationsManager } from "./applications-manager";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const [applications, jobs] = await Promise.all([fetchApplications(), fetchJobs()]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Phase 2 foundation</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Application tracking tied directly to normalized jobs.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This keeps one source of truth for application state and prevents duplicate trackers when the same job is discovered from multiple platforms.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>Application queue workers can update one canonical status record</li>
            <li>Referral logic can skip jobs already marked as referred or applied</li>
            <li>Dashboard reporting can track funnel stages cleanly</li>
            <li>Later browser workers can write completion state without inventing new schemas</li>
          </ul>
        </Card>
      </div>

      <ApplicationsManager initialApplications={applications} jobs={jobs} />
    </main>
  );
}
