"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Briefcase,
  Flame,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Card, StatCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardSummary, type DashboardSummary } from "@/lib/api";

/* ─── helpers ──────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function priorityColor(p: string) {
  if (p === "urgent") return "text-rose-400 bg-rose-500/10 border-rose-500/25";
  if (p === "high") return "text-amber-400 bg-amber-500/10 border-amber-500/25";
  return "text-slate-400 bg-white/[.04] border-white/10";
}

/* ─── sub-components ────────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  sub,
  href,
  linkLabel = "View all",
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: "var(--surface-hi)", border: "1px solid var(--border)" }}
        >
          <Icon className="size-4 text-violet-400" />
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-white">{title}</h2>
          {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
        </div>
      </div>
      <Link href={href}>
        <Button variant="ghost" size="sm" className="gap-1.5">
          {linkLabel} <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    </div>
  );
}

function FreshJobCard({ job }: { job: DashboardSummary["freshJobs"][number] }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-white">{job.company}</p>
            <p className="mt-0.5 truncate text-sm text-slate-400">{job.title}</p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[.15em] ${priorityColor(job.jobPriority)}`}
          >
            {job.jobPriority}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded bg-white/[.04] px-2 py-0.5">{job.location || "Remote"}</span>
          <span>•</span>
          <span>{job.sourcePlatforms[0] ?? "Unknown"}</span>
          <span className="ml-auto">{timeAgo(job.discoveredAt)}</span>
        </div>
      </Card>
    </motion.div>
  );
}

function PipelineBar({
  items,
}: {
  items: Array<{ status: string; count: number }>;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    applied:      "bg-violet-500",
    screening:    "bg-cyan-500",
    interview:    "bg-amber-500",
    offer:        "bg-emerald-500",
    rejected:     "bg-rose-500",
    ghosted:      "bg-slate-600",
    withdrawn:    "bg-slate-700",
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-hi)" }}>
        {items.map((item) => (
          <motion.div
            key={item.status}
            className={`h-full ${colors[item.status] ?? "bg-slate-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${(item.count / total) * 100}%` }}
            transition={{ duration: .8, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${colors[item.status] ?? "bg-slate-500"}`} />
            <span className="text-xs capitalize text-slate-400">{item.status.replaceAll("_", " ")}</span>
            <span className="text-xs font-semibold text-slate-200">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main dashboard content ────────────────────────── */
function Dashboard({ summary }: { summary: DashboardSummary }) {
  const totalJobs = summary.metrics.find((m) => m.label.toLowerCase().includes("job"))?.value ?? "—";
  const totalApps = summary.metrics.find((m) => m.label.toLowerCase().includes("application"))?.value ?? "—";
  const totalReferrals = summary.metrics.find((m) => m.label.toLowerCase().includes("referral"))?.value ?? "—";
  const freshCount = summary.freshJobs.length;

  return (
    <div className="space-y-8">
      {/* ── Stat row ── */}
      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .4, delay: .1 }}
      >
        <StatCard label="Total Jobs" value={totalJobs} sub="in pipeline" accent="violet" />
        <StatCard label="Applications" value={totalApps} sub="submitted" accent="cyan" />
        <StatCard label="Referrals" value={totalReferrals} sub="in progress" accent="emerald" />
        <StatCard label="Fresh Jobs" value={freshCount} sub="hot right now" accent="amber" />
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Left: Fresh Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4, delay: .2 }}
        >
          <SectionHeader
            icon={Flame}
            title="Fresh Jobs"
            sub="High-priority openings in the last window"
            href="/fresh-jobs"
          />

          {summary.freshJobs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-14">
              <Zap className="size-8 text-slate-700" />
              <p className="text-sm text-slate-500">No hot jobs right now — check back soon</p>
              <Link href="/job-watchers">
                <Button variant="secondary" size="sm">Set up watchers</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {summary.freshJobs.slice(0, 6).map((job) => (
                <FreshJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Pipeline + Referrals */}
        <div className="space-y-6">
          {/* Application pipeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .4, delay: .3 }}
          >
            <SectionHeader
              icon={Send}
              title="Application Pipeline"
              sub="Your active application stages"
              href="/applications"
              linkLabel="Manage"
            />
            <Card className="p-5">
              {summary.applicationBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No applications tracked yet</p>
              ) : (
                <PipelineBar items={summary.applicationBreakdown} />
              )}
            </Card>
          </motion.div>

          {/* Referrals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .4, delay: .35 }}
          >
            <SectionHeader
              icon={Users}
              title="Referral Status"
              sub="Contacts and outreach at a glance"
              href="/referrals"
              linkLabel="Manage"
            />
            <Card className="p-5">
              {summary.referralBreakdown.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No referrals tracked yet</p>
              ) : (
                <div className="space-y-2.5">
                  {summary.referralBreakdown.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5"
                      style={{ background: "var(--surface-hi)" }}
                    >
                      <span className="text-sm capitalize text-slate-300">{item.status.replaceAll("_", " ")}</span>
                      <span className="rounded-full bg-white/[.06] px-2.5 py-0.5 text-xs font-bold text-white">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ── Recent job discoveries ── */}
      {summary.recentJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4, delay: .4 }}
        >
          <SectionHeader
            icon={Briefcase}
            title="Recent Discoveries"
            sub="Latest jobs added to your pipeline"
            href="/jobs"
          />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summary.recentJobs.slice(0, 6).map((job) => (
              <motion.div
                key={job.id}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{job.company}</p>
                      <p className="truncate text-xs text-slate-400">{job.title}</p>
                    </div>
                    <Badge variant="freshness" className="shrink-0 text-[10px]">
                      {job.freshnessStatus}
                    </Badge>
                  </div>
                  <p className="mt-2.5 text-[11px] text-slate-600">{timeAgo(job.discoveredAt)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Recent events ── */}
      {summary.recentEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .4, delay: .45 }}
        >
          <SectionHeader
            icon={TrendingUp}
            title="Recent Activity"
            sub="Latest system events"
            href="/operations"
            linkLabel="View logs"
          />
          <Card className="divide-y" style={{ borderColor: "var(--border)" }}>
            <style>{`.divide-y > * + * { border-top: 1px solid var(--border); }`}</style>
            {summary.recentEvents.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{event.eventType.replaceAll("_", " ")}</p>
                  <p className="truncate text-[11px] text-slate-500">{event.actor}</p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-600">{timeAgo(event.createdAt)}</span>
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 text-center"
      initial={{ opacity: 0, scale: .96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: .4 }}
    >
      <div
        className="mb-6 flex size-20 items-center justify-center rounded-3xl"
        style={{
          background: "linear-gradient(135deg,rgba(124,58,237,.2),rgba(79,70,229,.1))",
          border: "1px solid rgba(124,58,237,.25)",
          boxShadow: "0 0 40px rgba(124,58,237,.15)",
        }}
      >
        <Sparkles className="size-9 text-violet-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">You're all set up</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
        Start by adding job watchers to let AutoApply hunt for you around the clock.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/job-watchers">
          <Button variant="primary">Set up watchers</Button>
        </Link>
        <Link href="/onboarding">
          <Button variant="secondary">Complete profile</Button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── page ──────────────────────────────────────────── */
export default function HomePage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDashboardSummary()
      .then(setSummary)
      .catch(() => setError(true));
  }, []);

  const isEmpty =
    summary &&
    summary.freshJobs.length === 0 &&
    summary.recentJobs.length === 0 &&
    summary.applicationBreakdown.length === 0;

  return (
    <main className="min-h-screen px-6 py-8 xl:px-10">
      {/* ── Page header ── */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .35 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.25em] text-violet-400">Dashboard</p>
            <h1 className="text-4xl font-bold leading-tight grad-text">
              Your job hunt, on autopilot.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              AutoApply is scanning, matching, and applying so you don't have to.
            </p>
          </div>

          <div className="hidden gap-3 sm:flex">
            <Link href="/fresh-jobs">
              <Button variant="violet" size="sm">
                <Flame className="size-3.5" /> Fresh Jobs
              </Button>
            </Link>
            <Link href="/automation">
              <Button variant="secondary" size="sm">
                <Zap className="size-3.5" /> Automation
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-gradient-to-r from-violet-500/30 via-cyan-500/20 to-transparent" />
      </motion.div>

      {/* ── Content ── */}
      {error ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: .3 }}
        >
          <Card className="mx-auto max-w-lg p-8 text-center">
            <div
              className="mx-auto mb-4 size-2 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 10px rgba(251,191,36,.8)" }}
            />
            <p className="text-sm font-semibold text-amber-400">Backend unreachable</p>
            <p className="mt-2 text-sm text-slate-400">
              Start the backend to see your live dashboard. The UI is healthy.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link href="/automation">
                <Button variant="primary" size="sm">Open Automation</Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      ) : !summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <Dashboard summary={summary} />
      )}
    </main>
  );
}
