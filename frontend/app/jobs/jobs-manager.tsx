"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Job, JobSummaryResult } from "@/lib/api";

const emptySummaryForm = {
  jobId: "",
  company: "",
  jobTitle: "",
  jobDescription: "",
};

const selectClass =
  "h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20";

export function JobsManager({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [summaryForm, setSummaryForm] = useState(emptySummaryForm);
  const [summaryResult, setSummaryResult] = useState<JobSummaryResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshJobs() {
    const response = await fetch("/api/jobs", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to refresh jobs");
    const payload = (await response.json()) as { data: Job[] };
    setJobs(payload.data);
  }

  async function handleRefresh() {
    setError(null);
    setIsRefreshing(true);
    try {
      await refreshJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh jobs");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSummarySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSummarizing(true);
    try {
      const response = await fetch("/api/agents/job-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: summaryForm.company,
          jobTitle: summaryForm.jobTitle,
          jobDescription: summaryForm.jobDescription,
        }),
      });
      if (!response.ok) throw new Error("Unable to summarize job description");
      const payload = (await response.json()) as { data: JobSummaryResult };
      setSummaryResult(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to summarize job description");
    } finally {
      setIsSummarizing(false);
    }
  }

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-white">Jobs Board</p>
              <p className="text-xs text-slate-500">
                This board should reflect backend-discovered jobs, not manual intake.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300">
                {jobs.length} total
              </span>
              <Button disabled={isRefreshing} type="button" variant="ghost" onClick={() => void handleRefresh()}>
                {isRefreshing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="border-b border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="px-5 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            Product rule: the user should not enqueue scanners or add jobs manually. If this board is empty, the backend discovery path is not yet producing real jobs.
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <p className="font-semibold text-white">Normalized Jobs</p>
              <p className="text-xs text-slate-500">Duplicates are merged by company + role + location</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Location</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Freshness</TableHeaderCell>
                  <TableHeaderCell>Platforms</TableHeaderCell>
                  <TableHeaderCell>Link</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-14 text-center text-slate-500" colSpan={7}>
                      No jobs discovered yet. Connected platforms alone are not enough until authenticated discovery is producing real rows.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-white">{job.company}</TableCell>
                      <TableCell className="text-slate-300">{job.title}</TableCell>
                      <TableCell className="text-slate-400">{job.location}</TableCell>
                      <TableCell>
                        <Badge label={job.jobPriority} variant="priority" />
                      </TableCell>
                      <TableCell>
                        <Badge label={job.freshnessStatus} variant="freshness" />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {job.sourcePlatforms.map((p) => (
                            <Badge key={p} label={p} variant="platform" />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          className="inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-cyan-400"
                          href={job.jobUrl}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="size-3" />
                          Open
                        </a>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* AI Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-400">AI Job Summary</p>
          <h2 className="mb-5 text-lg font-semibold text-white">Paste JD to get fit brief</h2>

          <form className="space-y-3" onSubmit={handleSummarySubmit}>
            <select
              className={selectClass}
              value={summaryForm.jobId}
              onChange={(e) => {
                const selectedJob = jobs.find((job) => job.id === Number(e.target.value));
                setSummaryForm((c) => ({
                  ...c,
                  jobId: e.target.value,
                  company: selectedJob?.company ?? c.company,
                  jobTitle: selectedJob?.title ?? c.jobTitle,
                }));
              }}
            >
              <option value="">Optional: pick from inventory</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} — {job.title}
                </option>
              ))}
            </select>
            <Input
              placeholder="Company *"
              required
              value={summaryForm.company}
              onChange={(e) => setSummaryForm((c) => ({ ...c, company: e.target.value }))}
            />
            <Input
              placeholder="Job title *"
              required
              value={summaryForm.jobTitle}
              onChange={(e) => setSummaryForm((c) => ({ ...c, jobTitle: e.target.value }))}
            />
            <textarea
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
              placeholder="Paste the full job description here..."
              required
              rows={8}
              value={summaryForm.jobDescription}
              onChange={(e) => setSummaryForm((c) => ({ ...c, jobDescription: e.target.value }))}
            />
            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>
            ) : null}
            <Button className="w-full" disabled={isSummarizing} type="submit" variant="violet">
              {isSummarizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              Generate Summary
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Summary Result</p>
          <h2 className="mb-5 text-lg font-semibold text-white">Fit brief output</h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
              {summaryResult?.summary ?? "Generate a summary to see the fit brief here."}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500">Top Signals</p>
                <div className="space-y-1.5 text-sm text-slate-300">
                  {(summaryResult?.topSignals ?? ["Awaiting summary..."]).map((signal) => (
                    <p key={signal} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {signal}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.05] p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">Risks</p>
                <div className="space-y-1.5 text-sm text-slate-300">
                  {(summaryResult?.risks ?? ["Awaiting summary..."]).map((risk) => (
                    <p key={risk} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                      {risk}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {summaryResult ? (
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-2.5 text-xs text-violet-300">
                Template: {summaryResult.promptArtifact.templateName}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
