"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Job } from "@/lib/api";

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

export function JobsManager({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [form, setForm] = useState<JobFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  return (
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
                className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
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
          <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{jobs.length} jobs</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Location</TableHeaderCell>
                <TableHeaderCell>Sources</TableHeaderCell>
                <TableHeaderCell>Posted</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted" colSpan={5}>
                    No jobs ingested yet.
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.company}</TableCell>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>{job.location}</TableCell>
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
  );
}
