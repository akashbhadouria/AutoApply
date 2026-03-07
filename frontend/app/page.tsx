import Link from "next/link";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { LampContainer } from "@/components/aceternity/lamp";
import { RuntimeHealthBanner } from "@/components/runtime-health-banner";
import { Card } from "@/components/ui/card";
import { fetchBackendRuntimeStatus, fetchDashboardSummary, type DashboardSummary } from "@/lib/api";

const routes = [
  { href: "/onboarding", title: "Onboarding", description: "Founder and candidate setup flow for identity, resume, and launch readiness." },
  { href: "/connected-accounts", title: "Connected Accounts", description: "LinkedIn, email, Telegram, and WhatsApp connection state with approval mode." },
  { href: "/job-watchers", title: "Job Watchers", description: "Per-user near-real-time source watchers with polling, titles, and locations." },
  { href: "/fresh-jobs", title: "Fresh Jobs", description: "High-priority jobs detected inside the instant-response window." },
  { href: "/outreach-inbox", title: "Outreach Inbox", description: "Pending referral requests and approval-oriented outreach workflow." },
  { href: "/profile", title: "Profile", description: "Canonical identity data, salary fields, links, and ATS autofill primitives." },
  { href: "/jobs", title: "Jobs", description: "Normalized inventory with source-platform merging and queue-driven ingestion." },
  { href: "/applications", title: "Applications", description: "Application state attached to canonical jobs instead of fragmented trackers." },
  { href: "/referrals", title: "Referrals", description: "Contacts, outreach drafts, and referral statuses tied to jobs." },
  { href: "/notifications", title: "Notifications", description: "Dedicated delivery inbox across dashboard, email, Telegram, and WhatsApp channels." },
  { href: "/operations", title: "Operations", description: "Paused sessions, notifications, and runtime event audit trail." },
  { href: "/automation", title: "Automation", description: "Operator controls for queue producers and worker validation." },
  { href: "/field-mappings", title: "Field Mappings", description: "Self-learning ATS label memory for future autofill runs." },
  { href: "/settings", title: "Settings", description: "System-level configuration for channels, automation policy, and local ops defaults." },
];

function BreakdownCard({
  title,
  items,
  emptyState,
}: {
  title: string;
  items: Array<{ status: string; count: number }>;
  emptyState: string;
}) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">{emptyState}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3" key={item.status}>
              <span className="text-sm capitalize text-slate-200">{item.status.replaceAll("_", " ")}</span>
              <span className="rounded-full bg-slate-950/80 px-3 py-1 text-sm font-medium text-cyan-100">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const latestScannerRun = summary.latestScannerRun;
  const liveSourceCount = latestScannerRun?.sources.filter((source) => source.mode === "live").length ?? 0;
  const fallbackSourceCount = latestScannerRun?.sources.filter((source) => source.mode === "fallback").length ?? 0;
  const scannerErrorCount = latestScannerRun?.sources.filter((source) => source.error).length ?? 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summary.metrics.map((metric) => (
          <Card className="p-6" key={metric.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{metric.label}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{metric.detail}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Runtime status</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">System readiness at a glance.</h2>
            </div>
            <Link
              className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
              href="/automation"
            >
              Open automation
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {summary.statuses.map((status) => (
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4" key={status.label}>
                <div>
                  <p className="text-sm font-medium text-white">{status.label}</p>
                  <p className="mt-1 text-sm text-slate-400">{status.detail}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    status.status === "healthy"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {status.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <BentoGrid className="md:auto-rows-[13rem]">
          {routes.map((route, index) => (
            <BentoGridItem
              className={index === 0 || index === 4 ? "md:col-span-2" : ""}
              description={route.description}
              header={
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                    {route.title}
                  </span>
                  <Link className="text-sm text-cyan-300" href={route.href}>
                    Open
                  </Link>
                </div>
              }
              key={route.href}
              title={route.title}
            />
          ))}
        </BentoGrid>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <BreakdownCard emptyState="No applications tracked yet." items={summary.applicationBreakdown} title="Application breakdown" />
        <BreakdownCard emptyState="No referrals tracked yet." items={summary.referralBreakdown} title="Referral breakdown" />
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recent events</p>
          {summary.recentEvents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No worker or operator events have been recorded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {summary.recentEvents.map((event) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3" key={event.id}>
                  <p className="text-sm font-medium text-white">{event.eventType}</p>
                  <p className="mt-1 text-sm text-slate-400">{event.actor}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Fresh jobs</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Jobs in the instant-response window.</h2>
          </div>
          <Link className="text-sm font-medium text-cyan-300" href="/job-watchers">
            Open watchers
          </Link>
        </div>

        {summary.freshJobs.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">No fresh jobs are currently waiting in the high-priority window.</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {summary.freshJobs.map((job) => (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5" key={job.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{job.company}</p>
                    <p className="mt-1 text-sm text-slate-300">{job.title}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-300">
                    {job.jobPriority}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{job.location}</p>
                <p className="mt-2 text-sm text-slate-400">strategy: {job.applyStrategy}</p>
                <p className="mt-2 text-sm text-slate-400">sources: {job.sourcePlatforms.join(", ") || "none"}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  discovered {new Date(job.discoveredAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Scanner diagnostics</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Latest job discovery run by source.</h2>
          </div>
          <Link className="text-sm font-medium text-cyan-300" href="/automation">
            Trigger scanner
          </Link>
        </div>

        {!latestScannerRun ? (
          <p className="mt-6 text-sm text-slate-400">No scanner run has been recorded yet. Enqueue `job-scanner` from the Automation page.</p>
        ) : (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-4">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Jobs found</p>
                <p className="mt-3 text-3xl font-semibold text-white">{latestScannerRun.discoveredCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Live feeds</p>
                <p className="mt-3 text-3xl font-semibold text-white">{liveSourceCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Fallback feeds</p>
                <p className="mt-3 text-3xl font-semibold text-white">{fallbackSourceCount}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Feed errors</p>
                <p className="mt-3 text-3xl font-semibold text-white">{scannerErrorCount}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
              <span>titles: {latestScannerRun.searchTitles.join(", ") || "none"}</span>
              <span>locations: {latestScannerRun.locations.join(", ") || "none"}</span>
              <span>recency: {latestScannerRun.recencyDays} days</span>
              <span>run: {new Date(latestScannerRun.createdAt).toLocaleString()}</span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {latestScannerRun.sources.length === 0 ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                  No source diagnostics were attached to the last scanner run.
                </div>
              ) : (
                latestScannerRun.sources.map((source) => (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5" key={`${source.name}-${source.platform}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">{source.name}</p>
                        <p className="mt-1 text-sm text-slate-300">
                          {source.provider} on {source.platform.replaceAll("_", " ")}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                          source.mode === "live"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-fuchsia-500/15 text-fuchsia-300"
                        }`}
                      >
                        {source.mode}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">Discovered {source.discoveredCount} matching jobs.</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {source.error ? `error: ${source.error}` : "no source errors recorded"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recent job discoveries</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Most recent normalized jobs in the pipeline.</h2>
          </div>
          <Link className="text-sm font-medium text-cyan-300" href="/jobs">
            View jobs
          </Link>
        </div>

        {summary.recentJobs.length === 0 ? (
          <p className="mt-6 text-sm text-slate-400">No jobs have been discovered yet. Trigger the job scanner from the Automation page.</p>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {summary.recentJobs.map((job) => (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5" key={job.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{job.company}</p>
                    <p className="mt-1 text-sm text-slate-300">{job.title}</p>
                  </div>
                  <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                    {job.location}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-400">{job.sourcePlatforms.join(", ") || "No sources recorded"}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {job.freshnessStatus} / {job.jobPriority} / {job.applyStrategy}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                  discovered {new Date(job.discoveredAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

function DashboardErrorState({ message }: { message: string }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-400">Dashboard unavailable</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{message}</p>
        <p className="mt-4 text-sm text-slate-400">
          The shell is still healthy. The live dashboard summary could not be fetched from the backend.
        </p>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recommended recovery</p>
        <div className="mt-4 space-y-3 text-sm text-slate-200">
          <p>Run <span className="font-semibold text-white">npm run dev:stack</span> to bring up the supported local runtime.</p>
          <p>Verify <span className="font-semibold text-white">http://localhost:4000/health</span> returns a healthy response.</p>
          <p>Once the backend summary endpoint is reachable, this page will render live metrics automatically.</p>
        </div>
      </Card>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const runtimeStatus = await fetchBackendRuntimeStatus();

  try {
    const summary = await fetchDashboardSummary();

    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10">
        <BackgroundBeams />
        <div className="relative z-10 mx-auto max-w-7xl">
          <RuntimeHealthBanner initialStatus={runtimeStatus} />

          <LampContainer>
            <div className="mx-auto max-w-5xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-cyan-300">Dashboard</p>
              <h1 className="mt-6 text-5xl font-semibold leading-tight text-white md:text-7xl">
                Personal job hunter operations console.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                This dashboard is the live control surface for the system: normalized jobs, application state, referrals, queue readiness, ATS sessions, and runtime health in one place.
              </p>
              <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Run</p>
                  <p className="mt-2 text-sm text-slate-200">Use <span className="font-semibold text-white">npm run dev:stack</span> for the supported local runtime.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Queue</p>
                  <p className="mt-2 text-sm text-slate-200">Operators can validate worker flows directly from the automation page without touching Redis manually.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Learn</p>
                  <p className="mt-2 text-sm text-slate-200">Field mappings and paused ATS sessions keep improving future application runs.</p>
                </div>
              </div>
            </div>
          </LampContainer>

          <DashboardContent summary={summary} />
        </div>
      </main>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <main className="relative min-h-screen overflow-hidden px-6 py-10">
        <BackgroundBeams />
        <div className="relative z-10 mx-auto max-w-7xl">
          <RuntimeHealthBanner initialStatus={runtimeStatus} />

          <LampContainer>
            <div className="mx-auto max-w-5xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.42em] text-cyan-300">Dashboard</p>
              <h1 className="mt-6 text-5xl font-semibold leading-tight text-white md:text-7xl">
                Personal job hunter operations console.
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                The dashboard shell is available, but live summary data could not be loaded from the backend yet.
              </p>
            </div>
          </LampContainer>

          <DashboardErrorState message={message} />
        </div>
      </main>
    );
  }
}
