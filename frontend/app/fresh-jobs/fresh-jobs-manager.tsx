"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Job } from "@/lib/api";

export function FreshJobsManager({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [busyJobId, setBusyJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshJobs() {
    const response = await fetch("/api/jobs/fresh", { cache: "no-store" });
    const payload = (await response.json()) as { data: Job[] };
    setJobs(payload.data);
  }

  async function enqueueApplication(job: Job) {
    setBusyJobId(job.id);
    setError(null);

    try {
      const response = await fetch("/api/automation/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueName: "application-queue",
          payload: {
            jobId: job.id,
            sourcePlatform: job.primarySourcePlatform,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to enqueue application");
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to enqueue application");
    } finally {
      setBusyJobId(null);
    }
  }

  async function enqueueReferral(job: Job) {
    setBusyJobId(job.id);
    setError(null);

    try {
      const response = await fetch("/api/automation/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueName: "referral-engine",
          payload: {
            mode: "drafts",
            jobId: job.id,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to enqueue referral drafting");
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to enqueue referral drafting");
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Fresh inventory</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Jobs that need immediate attention.</h2>
        </div>
        <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" onClick={() => void refreshJobs()}>
          Refresh
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {jobs.length === 0 ? (
          <p className="text-sm text-muted">No fresh jobs are currently available.</p>
        ) : (
          jobs.map((job) => (
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
              <p className="mt-2 text-sm text-slate-400">sources: {job.sourcePlatforms.join(", ")}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                detected {new Date(job.discoveredAt).toLocaleString()}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={busyJobId === job.id} onClick={() => void enqueueReferral(job)}>
                  {busyJobId === job.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Queue referral
                </Button>
                <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyJobId === job.id} onClick={() => void enqueueApplication(job)}>
                  {busyJobId === job.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Queue apply
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
