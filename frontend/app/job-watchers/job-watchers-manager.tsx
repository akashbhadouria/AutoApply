"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { JobFeedWatcher } from "@/lib/api";

const emptyForm = {
  name: "",
  sourcePlatform: "linkedin" as JobFeedWatcher["sourcePlatform"],
  provider: "linkedin" as JobFeedWatcher["provider"],
  pollingIntervalSeconds: "60",
  searchTitles: "Frontend Engineer, React Developer",
  locations: "Bangalore, Remote India",
  recencyDays: "7",
};

export function JobWatchersManager({ initialWatchers }: { initialWatchers: JobFeedWatcher[] }) {
  const [watchers, setWatchers] = useState(initialWatchers);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busyWatcherId, setBusyWatcherId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshWatchers() {
    const response = await fetch("/api/me/job-watchers", { cache: "no-store" });
    const payload = (await response.json()) as { data: JobFeedWatcher[] };
    setWatchers(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/me/job-watchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sourcePlatform: form.sourcePlatform,
          provider: form.provider,
          pollingIntervalSeconds: Number(form.pollingIntervalSeconds),
          searchTitles: form.searchTitles.split(",").map((entry) => entry.trim()).filter(Boolean),
          locations: form.locations.split(",").map((entry) => entry.trim()).filter(Boolean),
          recencyDays: Number(form.recencyDays),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create watcher");
      }

      setForm(emptyForm);
      await refreshWatchers();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to create watcher");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(watcherId: number, status: JobFeedWatcher["status"]) {
    setBusyWatcherId(watcherId);
    setError(null);

    try {
      const response = await fetch(`/api/me/job-watchers/${watcherId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Unable to update watcher");
      }

      await refreshWatchers();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update watcher");
    } finally {
      setBusyWatcherId(null);
    }
  }

  async function handleRunWatcher(watcherId: number) {
    setBusyWatcherId(watcherId);
    setError(null);

    try {
      const response = await fetch("/api/automation/enqueue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueName: "job-feed-watcher",
          payload: { watcherId },
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to enqueue watcher");
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run watcher");
    } finally {
      setBusyWatcherId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Create watcher</p>
          <h2 className="text-2xl font-semibold text-ink">Per-user discovery rules.</h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Fresh frontend jobs" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={form.sourcePlatform} onChange={(event) => setForm((current) => ({ ...current, sourcePlatform: event.target.value as JobFeedWatcher["sourcePlatform"] }))}>
            <option value="linkedin">linkedin</option>
            <option value="instahyre">instahyre</option>
            <option value="hirist">hirist</option>
            <option value="naukri">naukri</option>
            <option value="company_site">company_site</option>
          </select>
          <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value as JobFeedWatcher["provider"] }))}>
            <option value="linkedin">linkedin</option>
            <option value="instahyre">instahyre</option>
            <option value="hirist">hirist</option>
            <option value="naukri">naukri</option>
            <option value="company_site">company_site</option>
            <option value="greenhouse">greenhouse</option>
            <option value="lever">lever</option>
            <option value="generic_json">generic_json</option>
            <option value="google_jobs">google_jobs</option>
          </select>
          <Input placeholder="Titles, comma separated" value={form.searchTitles} onChange={(event) => setForm((current) => ({ ...current, searchTitles: event.target.value }))} />
          <Input placeholder="Locations, comma separated" value={form.locations} onChange={(event) => setForm((current) => ({ ...current, locations: event.target.value }))} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Polling interval seconds" type="number" value={form.pollingIntervalSeconds} onChange={(event) => setForm((current) => ({ ...current, pollingIntervalSeconds: event.target.value }))} />
            <Input placeholder="Recency days" type="number" value={form.recencyDays} onChange={(event) => setForm((current) => ({ ...current, recencyDays: event.target.value }))} />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <Button className="w-full" disabled={isSaving} type="submit">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save watcher
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Active watcher inventory</p>
        <div className="mt-4 space-y-3">
          {watchers.length === 0 ? (
            <p className="text-sm text-muted">No watchers created yet.</p>
          ) : (
            watchers.map((watcher) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={watcher.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{watcher.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{watcher.provider} on {watcher.sourcePlatform}</p>
                  </div>
                  <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">{watcher.status}</span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{watcher.searchTitles.join(", ")} | {watcher.locations.join(", ")}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">poll every {watcher.pollingIntervalSeconds}s</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyWatcherId === watcher.id || watcher.status === "active"} onClick={() => void handleStatusChange(watcher.id, "active")}>Activate</Button>
                  <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyWatcherId === watcher.id || watcher.status === "paused"} onClick={() => void handleStatusChange(watcher.id, "paused")}>Pause</Button>
                  <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyWatcherId === watcher.id} onClick={() => void handleRunWatcher(watcher.id)}>
                    {busyWatcherId === watcher.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Run now
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
