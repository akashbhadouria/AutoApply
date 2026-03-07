"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pause, Play, RefreshCw, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AutomationQueue, EnqueuedAutomationJob } from "@/lib/api";

const defaultPayloads: Record<AutomationQueue["queueName"], string> = {
  "job-feed-watcher": JSON.stringify({ watcherId: 1 }, null, 2),
  "job-scanner": JSON.stringify(
    { searchTitles: ["Frontend Engineer", "React Developer"], locations: ["Bangalore", "Remote India"], recencyDays: 7 },
    null,
    2,
  ),
  "referral-engine": JSON.stringify({ mode: "drafts", jobId: 1 }, null, 2),
  "application-queue": JSON.stringify({ jobId: 1, sourcePlatform: "linkedin" }, null, 2),
  "browser-automation": JSON.stringify({ jobId: 1, formUrl: "https://example.com/workday/apply" }, null, 2),
  "outreach-execution": JSON.stringify({ outreachAttemptId: 1 }, null, 2),
  notifications: JSON.stringify({ notificationId: 1 }, null, 2),
};

const queueLabels: Record<string, string> = {
  "job-feed-watcher": "Job Feed Watcher",
  "job-scanner": "Job Scanner",
  "referral-engine": "Referral Engine",
  "application-queue": "Application Queue",
  "browser-automation": "Browser Automation",
  "outreach-execution": "Outreach Execution",
  notifications: "Notifications",
};

export function AutomationManager({ queues }: { queues: AutomationQueue[] }) {
  const [selectedQueue, setSelectedQueue] = useState<AutomationQueue["queueName"]>("job-scanner");
  const [payload, setPayload] = useState(defaultPayloads["job-scanner"]);
  const [lastJob, setLastJob] = useState<EnqueuedAutomationJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queueAction, setQueueAction] = useState<AutomationQueue["queueName"] | null>(null);
  const [queueSnapshots, setQueueSnapshots] = useState(queues);
  const hasQueues = queues.length > 0;

  const selectedQueueSnapshot = useMemo(
    () => queueSnapshots.find((q) => q.queueName === selectedQueue) ?? null,
    [queueSnapshots, selectedQueue],
  );

  async function refreshQueues() {
    const response = await fetch("/api/automation/queues", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to refresh automation queues");
    const result = (await response.json()) as { data: AutomationQueue[] };
    setQueueSnapshots(result.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hasQueues) { setError("No automation queues available."); return; }
    setError(null);
    setIsLoading(true);
    try {
      const parsedPayload = JSON.parse(payload) as Record<string, unknown>;
      const response = await fetch("/api/automation/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueName: selectedQueue, payload: parsedPayload }),
      });
      if (!response.ok) throw new Error("Unable to enqueue automation job");
      const result = (await response.json()) as { data: EnqueuedAutomationJob };
      setLastJob(result.data);
      await refreshQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enqueue job");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQueueControl(queueName: AutomationQueue["queueName"], action: "pause" | "resume") {
    setError(null);
    setQueueAction(queueName);
    try {
      const response = await fetch(`/api/automation/queues/${queueName}/${action}`, { method: "POST" });
      if (!response.ok) throw new Error(`Unable to ${action} queue`);
      await refreshQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} queue`);
    } finally {
      setQueueAction(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Enqueue form */}
      <Card className="p-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-500">Enqueue Job</p>
        <h2 className="mb-5 text-lg font-semibold text-white">Trigger queue workers manually</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Queue</label>
            <select
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/50"
              disabled={!hasQueues}
              value={selectedQueue}
              onChange={(e) => {
                const next = e.target.value as AutomationQueue["queueName"];
                setSelectedQueue(next);
                setPayload(defaultPayloads[next]);
              }}
            >
              {queueSnapshots.map((q) => (
                <option key={q.queueName} value={q.queueName}>
                  {queueLabels[q.queueName] ?? q.queueName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Payload (JSON)</label>
            <textarea
              className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
              disabled={!hasQueues}
              rows={12}
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
            />
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : null}

          {lastJob ? (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <div className="text-sm text-emerald-300">
                <p className="font-medium">Enqueued successfully</p>
                <p className="text-xs opacity-80">Job ID: {lastJob.jobId}</p>
              </div>
            </div>
          ) : null}

          <Button className="w-full" disabled={isLoading || !hasQueues} type="submit">
            {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Zap className="mr-2 size-4" />}
            Enqueue Job
          </Button>
        </form>
      </Card>

      {/* Queues panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Queue Health</p>
          <Button onClick={() => void refreshQueues()} type="button" variant="ghost">
            <RefreshCw className="mr-1.5 size-3.5" />
            Refresh
          </Button>
        </div>

        {hasQueues ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {queueSnapshots.map((queue) => {
              const isLive = queue.stats.workerCount > 0 && !queue.stats.isPaused;
              const isSelected = queue.queueName === selectedQueue;
              return (
                <button
                  key={queue.queueName}
                  type="button"
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-cyan-500/30 bg-cyan-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                  onClick={() => {
                    setSelectedQueue(queue.queueName);
                    setPayload(defaultPayloads[queue.queueName]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">
                      {queueLabels[queue.queueName] ?? queue.queueName}
                    </p>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isLive
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {isLive ? "live" : queue.stats.isPaused ? "paused" : "idle"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
                    {[
                      ["waiting", queue.stats.waiting],
                      ["active", queue.stats.active],
                      ["failed", queue.stats.failed],
                      ["delayed", queue.stats.delayed],
                      ["done", queue.stats.completed],
                      ["workers", queue.stats.workerCount],
                    ].map(([label, val]) => (
                      <div key={label as string}>
                        <span className="text-slate-600">{label as string} </span>
                        <span className="font-medium text-slate-300">{val as number}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      className="h-7 px-2.5 text-xs"
                      disabled={queueAction === queue.queueName || queue.stats.isPaused}
                      onClick={() => void handleQueueControl(queue.queueName, "pause")}
                      type="button"
                      variant="ghost"
                    >
                      {queueAction === queue.queueName ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Pause className="size-3" />
                      )}
                      <span className="ml-1">Pause</span>
                    </Button>
                    <Button
                      className="h-7 px-2.5 text-xs"
                      disabled={queueAction === queue.queueName || !queue.stats.isPaused}
                      onClick={() => void handleQueueControl(queue.queueName, "resume")}
                      type="button"
                      variant="ghost"
                    >
                      {queueAction === queue.queueName ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Play className="size-3" />
                      )}
                      <span className="ml-1">Resume</span>
                    </Button>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-sm text-slate-500">No queues returned by the backend.</Card>
        )}

        {/* Selected queue detail */}
        {selectedQueueSnapshot && (
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {queueLabels[selectedQueueSnapshot.queueName]} — Retry Policy
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {[
                ["Attempts", selectedQueueSnapshot.retryPolicy.attempts],
                ["Backoff", `${selectedQueueSnapshot.retryPolicy.backoffDelayMs}ms`],
                ["Keep on complete", selectedQueueSnapshot.retryPolicy.removeOnComplete],
                ["Keep on fail", selectedQueueSnapshot.retryPolicy.removeOnFail],
                ["Backlog", selectedQueueSnapshot.stats.waiting + selectedQueueSnapshot.stats.delayed],
                ["Prioritized", selectedQueueSnapshot.stats.prioritized],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between gap-2">
                  <span className="text-slate-500">{label as string}</span>
                  <span className="font-medium text-slate-200">{val as string | number}</span>
                </div>
              ))}
            </div>

            {selectedQueueSnapshot.recentFailures.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Recent Failures</p>
                <div className="space-y-2">
                  {selectedQueueSnapshot.recentFailures.map((f) => (
                    <div key={f.id} className="rounded-xl border border-red-500/10 bg-red-500/[0.05] px-4 py-3">
                      <p className="text-sm font-medium text-white">{f.name}</p>
                      <p className="mt-1 text-xs text-red-300">{f.failedReason}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {f.finishedOn ? new Date(f.finishedOn).toLocaleString() : "Time unavailable"} · {f.attemptsMade} attempts
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
