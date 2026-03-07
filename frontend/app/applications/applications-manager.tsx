"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Application, ApplyAttempt, Job } from "@/lib/api";

interface ApplicationFormState {
  jobId: string;
  sourcePlatform: Job["primarySourcePlatform"];
  applied: boolean;
  appliedDate: string;
  status: Application["status"];
}

const emptyForm: ApplicationFormState = {
  jobId: "",
  sourcePlatform: "linkedin",
  applied: false,
  appliedDate: "",
  status: "pending",
};

const selectClass =
  "h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20";

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ApplicationsManager({
  initialApplications,
  initialApplyAttempts,
  jobs,
}: {
  initialApplications: Application[];
  initialApplyAttempts: ApplyAttempt[];
  jobs: Job[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [applyAttempts, setApplyAttempts] = useState(initialApplyAttempts);
  const [form, setForm] = useState<ApplicationFormState>(emptyForm);
  const [attemptStatusFilter, setAttemptStatusFilter] = useState<"all" | ApplyAttempt["status"]>("all");
  const [attemptStrategyFilter, setAttemptStrategyFilter] = useState<"all" | ApplyAttempt["strategy"]>("all");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshingAttempts, setIsRefreshingAttempts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobOptions = useMemo(
    () =>
      jobs.map((job) => ({
        id: job.id,
        label: `${job.company} — ${job.title}`,
        defaultPlatform: job.primarySourcePlatform,
      })),
    [jobs],
  );

  const filteredAttempts = useMemo(() => {
    return applyAttempts.filter((attempt) => {
      if (attemptStatusFilter !== "all" && attempt.status !== attemptStatusFilter) return false;
      if (attemptStrategyFilter !== "all" && attempt.strategy !== attemptStrategyFilter) return false;
      if (selectedJobId != null && attempt.jobId !== selectedJobId) return false;
      return true;
    });
  }, [applyAttempts, attemptStatusFilter, attemptStrategyFilter, selectedJobId]);

  const selectedJobAttempts = useMemo(
    () => (selectedJobId == null ? [] : applyAttempts.filter((attempt) => attempt.jobId === selectedJobId)),
    [applyAttempts, selectedJobId],
  );

  const attemptMetrics = useMemo(() => {
    return {
      total: applyAttempts.length,
      submitted: applyAttempts.filter((attempt) => attempt.status === "submitted").length,
      failed: applyAttempts.filter((attempt) => attempt.status === "failed").length,
      browser: applyAttempts.filter((attempt) => attempt.strategy === "browser").length,
    };
  }, [applyAttempts]);

  async function refreshApplications() {
    const response = await fetch("/api/applications", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to refresh applications");
    const payload = (await response.json()) as { data: Application[] };
    setApplications(payload.data);
  }

  async function refreshApplyAttempts(nextSelectedJobId: number | null = selectedJobId) {
    setIsRefreshingAttempts(true);
    try {
      const query = new URLSearchParams();
      query.set("limit", "40");
      if (attemptStatusFilter !== "all") query.set("status", attemptStatusFilter);
      if (attemptStrategyFilter !== "all") query.set("strategy", attemptStrategyFilter);

      const endpoint =
        nextSelectedJobId == null
          ? `/api/apply-attempts?${query.toString()}`
          : `/api/apply-attempts/job/${nextSelectedJobId}`;

      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to refresh apply attempts");
      const payload = (await response.json()) as { data: ApplyAttempt[] };
      setApplyAttempts(payload.data);
    } finally {
      setIsRefreshingAttempts(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(form.jobId),
          sourcePlatform: form.sourcePlatform,
          applied: form.applied,
          appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : undefined,
          status: form.status,
        }),
      });
      if (!response.ok) throw new Error("Unable to save the application");
      setForm(emptyForm);
      await Promise.all([refreshApplications(), refreshApplyAttempts()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  useEffect(() => {
    setApplyAttempts(initialApplyAttempts);
  }, [initialApplyAttempts]);

  async function handleAttemptFilterChange(nextStatus: "all" | ApplyAttempt["status"], nextStrategy = attemptStrategyFilter) {
    setAttemptStatusFilter(nextStatus);
    setAttemptStrategyFilter(nextStrategy);
    setSelectedJobId(null);

    setIsRefreshingAttempts(true);
    try {
      const query = new URLSearchParams();
      query.set("limit", "40");
      if (nextStatus !== "all") query.set("status", nextStatus);
      if (nextStrategy !== "all") query.set("strategy", nextStrategy);

      const response = await fetch(`/api/apply-attempts?${query.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to refresh apply attempts");
      const payload = (await response.json()) as { data: ApplyAttempt[] };
      setApplyAttempts(payload.data);
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : "Failed to refresh apply attempts");
    } finally {
      setIsRefreshingAttempts(false);
    }
  }

  async function handleAttemptStrategyChange(nextStrategy: "all" | ApplyAttempt["strategy"]) {
    await handleAttemptFilterChange(attemptStatusFilter, nextStrategy);
  }

  async function handleSelectJob(jobId: number | null) {
    setSelectedJobId(jobId);
    setError(null);

    if (jobId == null) {
      await refreshApplyAttempts(null);
      return;
    }

    setIsRefreshingAttempts(true);
    try {
      const response = await fetch(`/api/apply-attempts/job/${jobId}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load apply attempts for job");
      const payload = (await response.json()) as { data: ApplyAttempt[] };
      setApplyAttempts(payload.data);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : "Failed to load apply attempts for job");
    } finally {
      setIsRefreshingAttempts(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard accent="violet" label="Applications" sub="canonical tracker" value={applications.length} />
        <StatCard accent="cyan" label="Apply Attempts" sub="latest execution audits" value={attemptMetrics.total} />
        <StatCard accent="emerald" label="Submitted" sub="successful direct or browser runs" value={attemptMetrics.submitted} />
        <StatCard accent="amber" label="Browser Fallbacks" sub="expensive path usage" value={attemptMetrics.browser} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card className="p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500">Track Application</p>
          <h2 className="mb-5 text-lg font-semibold text-white">Attach state to a job record</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="job-id">
                Job
              </label>
              <select
                className={selectClass}
                id="job-id"
                onChange={(e) => {
                  const nextJobId = e.target.value;
                  const selected = jobOptions.find((j) => String(j.id) === nextJobId);
                  setForm((c) => ({
                    ...c,
                    jobId: nextJobId,
                    sourcePlatform: selected?.defaultPlatform ?? c.sourcePlatform,
                  }));
                }}
                required
                value={form.jobId}
              >
                <option value="">Select a job</option>
                {jobOptions.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400" htmlFor="application-source">
                  Platform
                </label>
                <select
                  className={selectClass}
                  id="application-source"
                  onChange={(e) =>
                    setForm((c) => ({ ...c, sourcePlatform: e.target.value as Job["primarySourcePlatform"] }))
                  }
                  value={form.sourcePlatform}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="instahyre">Instahyre</option>
                  <option value="hirist">Hirist</option>
                  <option value="naukri">Naukri</option>
                  <option value="company_site">Company Site</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400" htmlFor="application-status">
                  Status
                </label>
                <select
                  className={selectClass}
                  id="application-status"
                  onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as Application["status"] }))}
                  value={form.status}
                >
                  <option value="pending">Pending</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="rejected">Rejected</option>
                  <option value="offer">Offer</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 transition hover:border-white/20">
              <input
                checked={form.applied}
                className="size-4 accent-cyan-400"
                id="applied"
                onChange={(e) => setForm((c) => ({ ...c, applied: e.target.checked }))}
                type="checkbox"
              />
              <span className="text-sm font-medium text-slate-200">Mark as applied</span>
            </label>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400" htmlFor="applied-date">
                Applied date
              </label>
              <input
                className={selectClass}
                id="applied-date"
                onChange={(e) => setForm((c) => ({ ...c, appliedDate: e.target.value }))}
                type="datetime-local"
                value={form.appliedDate}
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Application
            </Button>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <p className="font-semibold text-white">Tracked Applications</p>
              <p className="text-xs text-slate-500">One record per normalized job</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
              {applications.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Applied</TableHeaderCell>
                  <TableHeaderCell>Platform</TableHeaderCell>
                  <TableHeaderCell>Audit</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-14 text-center text-slate-500" colSpan={6}>
                      No applications tracked yet. Add one using the form.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => {
                    const relatedAttempts = initialApplyAttempts.filter((attempt) => attempt.jobId === app.jobId);

                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium text-white">{app.company}</TableCell>
                        <TableCell className="text-slate-300">{app.title}</TableCell>
                        <TableCell>
                          <Badge label={app.status} variant="application" />
                        </TableCell>
                        <TableCell className="text-sm text-slate-400">
                          {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge label={app.sourcePlatform} variant="platform" />
                        </TableCell>
                        <TableCell>
                          <Button onClick={() => void handleSelectJob(app.jobId)} size="sm" variant="ghost">
                            {relatedAttempts.length} attempts
                            <ChevronRight className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Apply attempt audit</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">See which strategy actually ran.</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isRefreshingAttempts} onClick={() => void refreshApplyAttempts()} variant="secondary">
              {isRefreshingAttempts ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Refresh
            </Button>
            {selectedJobId != null ? (
              <Button onClick={() => void handleSelectJob(null)} variant="ghost">
                Clear job focus
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-[180px_180px_auto]">
          <select
            className={selectClass}
            value={attemptStatusFilter}
            onChange={(event) =>
              void handleAttemptFilterChange(event.target.value as "all" | ApplyAttempt["status"])
            }
          >
            <option value="all">All statuses</option>
            <option value="queued">Queued</option>
            <option value="submitted">Submitted</option>
            <option value="failed">Failed</option>
            <option value="unsupported">Unsupported</option>
          </select>

          <select
            className={selectClass}
            value={attemptStrategyFilter}
            onChange={(event) =>
              void handleAttemptStrategyChange(event.target.value as "all" | ApplyAttempt["strategy"])
            }
          >
            <option value="all">All strategies</option>
            <option value="api">API</option>
            <option value="http_form">HTTP Form</option>
            <option value="browser">Browser</option>
          </select>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              {filteredAttempts.length} visible attempts
            </span>
            {selectedJobId != null ? <span>Focused on job #{selectedJobId}</span> : null}
          </div>
        </div>

        {filteredAttempts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-500">
            No apply attempts match the current filters yet.
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              {filteredAttempts.map((attempt) => (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={attempt.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {attempt.company} · {attempt.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {attempt.provider} · {formatTime(attempt.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{attempt.strategy}</Badge>
                      <Badge>{attempt.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Duration</p>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {attempt.durationMs != null ? `${attempt.durationMs} ms` : "Not recorded"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">External ref</p>
                      <p className="mt-2 truncate text-sm font-medium text-slate-100">
                        {attempt.externalReference ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Payload keys</p>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {Object.keys(attempt.requestPayload).length || 0} request / {Object.keys(attempt.responseSummary).length || 0} response
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Focused job audit</p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {selectedJobId == null ? "Pick a tracked application to inspect its execution history." : `Job #${selectedJobId} execution trail`}
                </h3>
              </div>

              {selectedJobId == null ? null : selectedJobAttempts.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center text-sm text-slate-500">
                  No apply attempts were recorded for this job yet.
                </div>
              ) : (
                selectedJobAttempts.map((attempt) => (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={`focused-${attempt.id}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{attempt.strategy}</p>
                      <Badge>{attempt.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{attempt.provider}</p>
                    <p className="mt-3 text-sm text-slate-300">Created {formatTime(attempt.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
