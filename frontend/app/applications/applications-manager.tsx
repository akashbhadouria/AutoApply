"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Application, Job } from "@/lib/api";

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

export function ApplicationsManager({
  initialApplications,
  jobs,
}: {
  initialApplications: Application[];
  jobs: Job[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [form, setForm] = useState<ApplicationFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jobOptions = useMemo(
    () =>
      jobs.map((job) => ({
        id: job.id,
        label: `${job.company} - ${job.title} - ${job.location}`,
        defaultPlatform: job.primarySourcePlatform,
      })),
    [jobs],
  );

  async function refreshApplications() {
    const response = await fetch("/api/applications", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh applications");
    }

    const payload = (await response.json()) as { data: Application[] };
    setApplications(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: Number(form.jobId),
          sourcePlatform: form.sourcePlatform,
          applied: form.applied,
          appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : undefined,
          status: form.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save the application");
      }

      setForm(emptyForm);
      await refreshApplications();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save application");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Applications Tracker</p>
          <h2 className="text-2xl font-semibold text-ink">Attach application state to a canonical job record.</h2>
          <p className="text-sm text-muted">
            Each job can have one application record. Updating the same job again will overwrite the tracked state instead of creating duplicates.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="job-id">
              Job
            </label>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              id="job-id"
              onChange={(event) => {
                const nextJobId = event.target.value;
                const selectedJob = jobOptions.find((job) => String(job.id) === nextJobId);
                setForm((current) => ({
                  ...current,
                  jobId: nextJobId,
                  sourcePlatform: selectedJob?.defaultPlatform ?? current.sourcePlatform,
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink" htmlFor="application-source">
                Source platform
              </label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                id="application-source"
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
              <label className="text-sm font-medium text-ink" htmlFor="application-status">
                Status
              </label>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                id="application-status"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as Application["status"],
                  }))
                }
                value={form.status}
              >
                <option value="pending">pending</option>
                <option value="applied">applied</option>
                <option value="interview">interview</option>
                <option value="rejected">rejected</option>
                <option value="offer">offer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3">
            <input
              checked={form.applied}
              id="applied"
              onChange={(event) => setForm((current) => ({ ...current, applied: event.target.checked }))}
              type="checkbox"
            />
            <label className="text-sm font-medium text-ink" htmlFor="applied">
              Mark as applied
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-ink" htmlFor="applied-date">
              Applied date
            </label>
            <input
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              id="applied-date"
              onChange={(event) => setForm((current) => ({ ...current, appliedDate: event.target.value }))}
              type="datetime-local"
              value={form.appliedDate}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save application
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-2">
        <div className="flex items-center justify-between px-4 pb-4 pt-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Tracked applications</p>
            <p className="text-sm text-muted">One application record per normalized job.</p>
          </div>
          <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{applications.length} applications</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Applied</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted" colSpan={5}>
                    No applications tracked yet.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell className="font-medium">{application.company}</TableCell>
                    <TableCell>{application.title}</TableCell>
                    <TableCell className="capitalize">{application.status}</TableCell>
                    <TableCell>{application.appliedDate ? new Date(application.appliedDate).toLocaleString() : "No"}</TableCell>
                    <TableCell className="text-muted">{application.sourcePlatform}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
