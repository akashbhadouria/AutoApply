"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Job, JobSummaryResult } from "@/lib/api";

interface JobFormState {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  sourcePlatform: Job["primarySourcePlatform"];
  postedDate: string;
}

const emptyForm: JobFormState = {
  company: "",
  title: "",
  location: "",
  jobUrl: "",
  sourcePlatform: "linkedin",
  postedDate: "",
};

const emptySummaryForm = {
  jobId: "",
  company: "",
  jobTitle: "",
  jobDescription: "",
};

export function JobsManager({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [summaryForm, setSummaryForm] = useState(emptySummaryForm);
  const [summaryResult, setSummaryResult] = useState<JobSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshJobs() {
    const response = await fetch("/api/jobs", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh jobs");
    }

    const payload = (await response.json()) as { data: Job[] };
    setJobs(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: form.company,
          title: form.title,
          location: form.location,
          jobUrl: form.jobUrl,
          sourcePlatform: form.sourcePlatform,
          postedDate: form.postedDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to ingest the job");
      }

      setForm(emptyForm);
      await refreshJobs();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to ingest job");
    } finally {
      setIsLoading(false);
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

      if (!response.ok) {
        throw new Error("Unable to summarize job description");
      }

      const payload = (await response.json()) as { data: JobSummaryResult };
      setSummaryResult(payload.data);
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Failed to summarize job description");
    } finally {
      setIsSummarizing(false);
    }
  }

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Jobs Intake</p>
          <h2 className="text-2xl font-semibold text-ink">Normalize jobs before referrals and applications touch them.</h2>
          <p className="text-sm text-muted">
            Submitting the same company, role, and location from another source will merge the record and append the new platform instead of duplicating the job.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="company">
              Company
            </label>
            <Input
              id="company"
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
              placeholder="Swiggy"
              required
              value={form.company}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="title">
              Role
            </label>
            <Input
              id="title"
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Frontend Engineer"
              required
              value={form.title}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="location">
              Location
            </label>
            <Input
              id="location"
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              placeholder="Bangalore"
              required
              value={form.location}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="job-url">
              Job URL
            </label>
            <Input
              id="job-url"
              onChange={(event) => setForm((current) => ({ ...current, jobUrl: event.target.value }))}
              placeholder="https://jobs.example.com/frontend-engineer"
              required
              value={form.jobUrl}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="source-platform">
                Source platform
              </label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                id="source-platform"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourcePlatform: event.target.value as Job["primarySourcePlatform"],
                  }))
                }
                value={form.sourcePlatform}
              >
                <option value="linkedin">linkedin</option>
                <option value="instahyre">instahyre</option>
                <option value="hirist">hirist</option>
                <option value="naukri">naukri</option>
                <option value="company_site">company_site</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="posted-date">
                Posted date
              </label>
              <Input
                id="posted-date"
                onChange={(event) => setForm((current) => ({ ...current, postedDate: event.target.value }))}
                type="date"
                value={form.postedDate}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Ingest job
          </Button>
        </form>
        </Card>

        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Normalized jobs</p>
              <p className="text-sm text-muted">Duplicate job discoveries are merged into a single record with multiple sources.</p>
            </div>
            <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{jobs.length} jobs</p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Location</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Sources</TableHeaderCell>
                  <TableHeaderCell>Posted</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={6}>
                      No jobs ingested yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.company}</TableCell>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                          job.jobPriority === "high"
                            ? "bg-amber-500/15 text-amber-300"
                            : job.freshnessStatus === "fresh"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-500/15 text-slate-300"
                        }`}>
                          {job.jobPriority} / {job.applyStrategy}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted">{job.sourcePlatforms.join(", ")}</TableCell>
                      <TableCell>{job.postedDate ?? "Unknown"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Agent Summary</p>
            <h2 className="text-2xl font-semibold text-ink">Paste a job description and generate a quick fit brief.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSummarySubmit}>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={summaryForm.jobId}
              onChange={(event) => {
                const selectedJob = jobs.find((job) => job.id === Number(event.target.value));
                setSummaryForm((current) => ({
                  ...current,
                  jobId: event.target.value,
                  company: selectedJob?.company ?? current.company,
                  jobTitle: selectedJob?.title ?? current.jobTitle,
                }));
              }}
            >
              <option value="">Optional canonical job context</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} - {job.title}
                </option>
              ))}
            </select>
            <Input
              placeholder="Company"
              required
              value={summaryForm.company}
              onChange={(event) => setSummaryForm((current) => ({ ...current, company: event.target.value }))}
            />
            <Input
              placeholder="Job title"
              required
              value={summaryForm.jobTitle}
              onChange={(event) => setSummaryForm((current) => ({ ...current, jobTitle: event.target.value }))}
            />
            <textarea
              className="min-h-40 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Paste the job description here"
              required
              value={summaryForm.jobDescription}
              onChange={(event) => setSummaryForm((current) => ({ ...current, jobDescription: event.target.value }))}
            />
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isSummarizing} type="submit">
              {isSummarizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Summarize job description
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Summary Output</p>
            <h2 className="text-2xl font-semibold text-ink">Use the brief to decide whether to prioritize outreach or direct application.</h2>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 text-sm text-slate-300">
              {summaryResult?.summary ?? "No summary generated yet."}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Top signals</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {(summaryResult?.topSignals ?? ["Generate a summary to see key fit signals."]).map((signal) => (
                    <p key={signal}>{signal}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Risks</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  {(summaryResult?.risks ?? ["Generate a summary to see possible scope or fit risks."]).map((risk) => (
                    <p key={risk}>{risk}</p>
                  ))}
                </div>
              </div>
            </div>
            {summaryResult ? (
              <div className="rounded-[20px] border border-cyan-400/20 bg-cyan-400/10 p-4 text-xs text-cyan-100">
                Prompt template: {summaryResult.promptArtifact.templateName}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
