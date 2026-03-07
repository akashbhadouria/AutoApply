"use client";

import { useMemo, useState } from "react";
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
  "referral-engine": JSON.stringify({ mode: "drafts", jobId: 1 }, null, 2),
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
  const [queueSnapshots, setQueueSnapshots] = useState(queues);
  const hasQueues = queues.length > 0;
  const selectedQueueSnapshot = useMemo(
    () => queueSnapshots.find((queue) => queue.queueName === selectedQueue) ?? null,
    [queueSnapshots, selectedQueue],
  );

  async function refreshQueues() {
    const response = await fetch("/api/automation/queues", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh automation queues");
    }

    const payload = (await response.json()) as { data: AutomationQueue[] };
    setQueueSnapshots(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasQueues) {
      setError("No automation queues are available.");
      return;
    }
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
      await refreshQueues();
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
            disabled={!hasQueues}
            value={selectedQueue}
            onChange={(event) => {
              const nextQueue = event.target.value as AutomationQueue["queueName"];
              setSelectedQueue(nextQueue);
              setPayload(defaultPayloads[nextQueue]);
            }}
          >
            {queueSnapshots.map((queue) => (
              <option key={queue.queueName} value={queue.queueName}>
                {queue.queueName}
              </option>
            ))}
          </select>

          <textarea
            className="min-h-72 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
            disabled={!hasQueues}
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button className="w-full" disabled={isLoading || !hasQueues} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Enqueue job
          </Button>
        </form>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Queue snapshots</p>
            <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" onClick={() => void refreshQueues()} type="button">
              Refresh
            </Button>
          </div>
          {hasQueues ? (
            <div className="mt-4 space-y-3">
              {queueSnapshots.map((queue) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={queue.queueName}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-ink">{queue.queueName}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                        queue.stats.workerCount > 0 && !queue.stats.isPaused
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {queue.stats.workerCount > 0 && !queue.stats.isPaused ? "live" : "degraded"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
                    <p>waiting: {queue.stats.waiting}</p>
                    <p>active: {queue.stats.active}</p>
                    <p>failed: {queue.stats.failed}</p>
                    <p>delayed: {queue.stats.delayed}</p>
                    <p>completed: {queue.stats.completed}</p>
                    <p>workers: {queue.stats.workerCount}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No queues were returned by the backend.</p>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Selected queue health</p>
          {selectedQueueSnapshot ? (
            <div className="mt-4 space-y-3 text-sm text-ink">
              <p>Queue: {selectedQueueSnapshot.queueName}</p>
              <p>Workers connected: {selectedQueueSnapshot.stats.workerCount}</p>
              <p>Paused: {selectedQueueSnapshot.stats.isPaused ? "yes" : "no"}</p>
              <p>Backlog: {selectedQueueSnapshot.stats.waiting + selectedQueueSnapshot.stats.delayed}</p>
              <p>Waiting children: {selectedQueueSnapshot.stats.waitingChildren}</p>
              <p>Prioritized: {selectedQueueSnapshot.stats.prioritized}</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Retry policy</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <p>attempts: {selectedQueueSnapshot.retryPolicy.attempts}</p>
                  <p>backoff: {selectedQueueSnapshot.retryPolicy.backoffDelayMs}ms</p>
                  <p>remove complete: {selectedQueueSnapshot.retryPolicy.removeOnComplete}</p>
                  <p>remove fail: {selectedQueueSnapshot.retryPolicy.removeOnFail}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No queue selected.</p>
          )}
        </Card>

        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Recent failed jobs</p>
          {selectedQueueSnapshot && selectedQueueSnapshot.recentFailures.length > 0 ? (
            <div className="mt-4 space-y-3">
              {selectedQueueSnapshot.recentFailures.map((failure) => (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={failure.id}>
                  <p className="text-sm font-medium text-ink">{failure.name}</p>
                  <p className="mt-2 text-xs text-slate-300">job id: {failure.id}</p>
                  <p className="mt-1 text-xs text-slate-300">attempts made: {failure.attemptsMade}</p>
                  <p className="mt-1 text-xs text-slate-300">{failure.failedReason}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    {failure.finishedOn ? new Date(failure.finishedOn).toLocaleString() : "finish time unavailable"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">No failed jobs retained for the selected queue.</p>
          )}
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
