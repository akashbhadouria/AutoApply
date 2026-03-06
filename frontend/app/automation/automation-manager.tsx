"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AutomationQueue, EnqueuedAutomationJob } from "@/lib/api";

const defaultPayloads: Record<AutomationQueue["queueName"], string> = {
  "job-scanner": JSON.stringify(
    {
      searchTitles: ["Frontend Engineer", "React Developer"],
      locations: ["Bangalore", "Remote India"],
      recencyDays: 7,
    },
    null,
    2,
  ),
  "referral-engine": JSON.stringify({ jobId: 1 }, null, 2),
  "application-queue": JSON.stringify({ jobId: 1, sourcePlatform: "linkedin" }, null, 2),
  "browser-automation": JSON.stringify({ jobId: 1, formUrl: "https://example.com/workday/apply" }, null, 2),
  notifications: JSON.stringify({ notificationId: 1 }, null, 2),
};

export function AutomationManager({ queues }: { queues: AutomationQueue[] }) {
  const [selectedQueue, setSelectedQueue] = useState<AutomationQueue["queueName"]>("job-scanner");
  const [payload, setPayload] = useState(defaultPayloads["job-scanner"]);
  const [lastJob, setLastJob] = useState<EnqueuedAutomationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const parsedPayload = JSON.parse(payload) as Record<string, unknown>;
      const response = await fetch("/api/automation/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueName: selectedQueue,
          payload: parsedPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to enqueue automation job");
      }

      const result = (await response.json()) as { data: EnqueuedAutomationJob };
      setLastJob(result.data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to enqueue job");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Automation Control</p>
          <h2 className="text-2xl font-semibold text-ink">Enqueue typed work for the worker runtime.</h2>
          <p className="text-sm text-muted">
            This page is a manual harness for the queue layer. It sends jobs through the same backend entrypoint n8n and future automations will use.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <select
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
            value={selectedQueue}
            onChange={(event) => {
              const nextQueue = event.target.value as AutomationQueue["queueName"];
              setSelectedQueue(nextQueue);
              setPayload(defaultPayloads[nextQueue]);
            }}
          >
            {queues.map((queue) => (
              <option key={queue.queueName} value={queue.queueName}>
                {queue.queueName}
              </option>
            ))}
          </select>

          <textarea
            className="min-h-72 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Enqueue job
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Available queues</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            {queues.map((queue) => (
              <li key={queue.queueName}>{queue.queueName}</li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Last enqueued job</p>
          {lastJob ? (
            <div className="mt-4 space-y-2 text-sm text-ink">
              <p>Queue: {lastJob.queueName}</p>
              <p>Job ID: {lastJob.jobId}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No automation jobs enqueued yet in this session.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
