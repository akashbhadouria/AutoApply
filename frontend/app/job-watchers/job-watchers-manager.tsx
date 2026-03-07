"use client";

import { useMemo, useState } from "react";
import { Activity, Flame, Loader2, Radar, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { JobFeedPreviewResult, JobFeedWatcher, JobWatcherActivity, RecentJobDiscoveryEvent } from "@/lib/api";

const emptyForm = {
  name: "",
  sourcePlatform: "linkedin" as JobFeedWatcher["sourcePlatform"],
  provider: "linkedin" as JobFeedWatcher["provider"],
  pollingIntervalSeconds: "60",
  searchTitles: "Frontend Engineer, React Developer",
  locations: "Bangalore, Remote India",
  recencyDays: "7",
  feedUrl: "",
  company: "",
};

const feedPresets = [
  {
    label: "Postman Greenhouse",
    provider: "greenhouse" as const,
    sourcePlatform: "company_site" as const,
    company: "Postman",
    feedUrl: "https://boards-api.greenhouse.io/v1/boards/postman/jobs",
  },
  {
    label: "Vercel Greenhouse",
    provider: "greenhouse" as const,
    sourcePlatform: "company_site" as const,
    company: "Vercel",
    feedUrl: "https://boards-api.greenhouse.io/v1/boards/vercel/jobs",
  },
  {
    label: "Figma Lever",
    provider: "lever" as const,
    sourcePlatform: "company_site" as const,
    company: "Figma",
    feedUrl: "https://api.lever.co/v0/postings/figma?mode=json",
  },
  {
    label: "Rippling Lever",
    provider: "lever" as const,
    sourcePlatform: "company_site" as const,
    company: "Rippling",
    feedUrl: "https://api.lever.co/v0/postings/rippling?mode=json",
  },
] as const;

function providerNeedsFeed(provider: JobFeedWatcher["provider"]) {
  return provider === "greenhouse" || provider === "lever" || provider === "generic_json" || provider === "google_jobs";
}

function formatTime(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function JobWatchersManager({
  initialWatchers,
  initialActivities,
  initialRecentEvents,
}: {
  initialWatchers: JobFeedWatcher[];
  initialActivities: JobWatcherActivity[];
  initialRecentEvents: RecentJobDiscoveryEvent[];
}) {
  const [watchers, setWatchers] = useState(initialWatchers);
  const [activities, setActivities] = useState(initialActivities);
  const [recentEvents, setRecentEvents] = useState(initialRecentEvents);
  const [form, setForm] = useState(emptyForm);
  const [eventFilter, setEventFilter] = useState<"all" | RecentJobDiscoveryEvent["eventType"]>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [busyWatcherId, setBusyWatcherId] = useState<number | null>(null);
  const [preview, setPreview] = useState<JobFeedPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const totalDiscoveries = activities.reduce((sum, watcher) => sum + watcher.recentDiscoveryCount, 0);
    const totalFresh = activities.reduce((sum, watcher) => sum + watcher.recentFreshCount, 0);
    const activeCount = activities.filter((watcher) => watcher.status === "active").length;

    return {
      totalDiscoveries,
      totalFresh,
      activeCount,
    };
  }, [activities]);

  async function refreshAll(nextEventFilter: "all" | RecentJobDiscoveryEvent["eventType"] = eventFilter) {
    setIsRefreshing(true);
    setError(null);

    try {
      const [watcherResponse, activityResponse, recentEventResponse] = await Promise.all([
        fetch("/api/me/job-watchers", { cache: "no-store" }),
        fetch("/api/me/job-watchers/activity", { cache: "no-store" }),
        fetch(
          `/api/me/job-watchers/discovery-events/recent?limit=12${
            nextEventFilter === "all" ? "" : `&eventType=${nextEventFilter}`
          }`,
          { cache: "no-store" },
        ),
      ]);

      if (!watcherResponse.ok || !activityResponse.ok || !recentEventResponse.ok) {
        throw new Error("Unable to refresh watcher telemetry");
      }

      const watcherPayload = (await watcherResponse.json()) as { data: JobFeedWatcher[] };
      const activityPayload = (await activityResponse.json()) as { data: JobWatcherActivity[] };
      const eventPayload = (await recentEventResponse.json()) as { data: RecentJobDiscoveryEvent[] };

      setWatchers(watcherPayload.data);
      setActivities(activityPayload.data);
      setRecentEvents(eventPayload.data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh watcher telemetry");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      if (providerNeedsFeed(form.provider) && !form.feedUrl.trim()) {
        throw new Error("Is provider ke liye live feed URL dena zaroori hai.");
      }

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
          configuration: providerNeedsFeed(form.provider)
            ? {
                feedUrl: form.feedUrl.trim(),
                company: form.company.trim() || undefined,
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create watcher");
      }

      setForm(emptyForm);
      setPreview(null);
      await refreshAll();
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

      await refreshAll();
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

      await refreshAll();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run watcher");
    } finally {
      setBusyWatcherId(null);
    }
  }

  async function handleEventFilterChange(nextFilter: "all" | RecentJobDiscoveryEvent["eventType"]) {
    setEventFilter(nextFilter);
    await refreshAll(nextFilter);
  }

  async function handlePreviewFeed() {
    setError(null);
    setPreview(null);
    setIsPreviewing(true);

    try {
      if (!providerNeedsFeed(form.provider)) {
        throw new Error("Preview abhi sirf greenhouse, lever, generic_json, aur google_jobs ke liye available hai.");
      }

      if (!form.feedUrl.trim()) {
        throw new Error("Preview ke liye live feed URL dena zaroori hai.");
      }

      const response = await fetch("/api/me/job-watchers/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          sourcePlatform: form.sourcePlatform,
          url: form.feedUrl.trim(),
          company: form.company.trim() || undefined,
          searchTitles: form.searchTitles.split(",").map((entry) => entry.trim()).filter(Boolean),
          locations: form.locations.split(",").map((entry) => entry.trim()).filter(Boolean),
          recencyDays: Number(form.recencyDays),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to preview feed");
      }

      const payload = (await response.json()) as { data: JobFeedPreviewResult };
      setPreview(payload.data);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Failed to preview feed");
    } finally {
      setIsPreviewing(false);
    }
  }

  function applyPreset(preset: (typeof feedPresets)[number]) {
    setPreview(null);
    setError(null);
    setForm((current) => ({
      ...current,
      sourcePlatform: preset.sourcePlatform,
      provider: preset.provider,
      company: preset.company,
      feedUrl: preset.feedUrl,
      name: current.name || `${preset.company} watcher`,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard accent="violet" label="Watchers" sub="configured rules" value={watchers.length} />
        <StatCard accent="cyan" label="Active" sub="currently polling" value={totals.activeCount} />
        <StatCard accent="amber" label="Fresh Hits" sub="last 24 hours" value={totals.totalFresh} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Create watcher</p>
            <h2 className="text-2xl font-semibold text-ink">Define a live source rule.</h2>
            <p className="text-sm leading-6 text-slate-400">
              Every watcher stores its own source, provider, polling interval, titles, and locations. Once active, the scheduler keeps it warm in the background.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              placeholder="Fresh frontend jobs"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <select
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm text-slate-100 outline-none transition-all focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
              value={form.sourcePlatform}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourcePlatform: event.target.value as JobFeedWatcher["sourcePlatform"] }))
              }
            >
              <option value="linkedin">linkedin</option>
              <option value="instahyre">instahyre</option>
              <option value="hirist">hirist</option>
              <option value="naukri">naukri</option>
              <option value="company_site">company_site</option>
            </select>
            <select
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 text-sm text-slate-100 outline-none transition-all focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
              value={form.provider}
              onChange={(event) =>
                setForm((current) => ({ ...current, provider: event.target.value as JobFeedWatcher["provider"] }))
              }
            >
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
            {providerNeedsFeed(form.provider) ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-ink">Quick presets</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {feedPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="secondary"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  placeholder="Live feed URL (required for greenhouse / lever / generic_json / google_jobs)"
                  value={form.feedUrl}
                  onChange={(event) => setForm((current) => ({ ...current, feedUrl: event.target.value }))}
                />
                <Input
                  placeholder="Company name override (optional)"
                  value={form.company}
                  onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                />
              </>
            ) : null}
            <Input
              placeholder="Titles, comma separated"
              value={form.searchTitles}
              onChange={(event) => setForm((current) => ({ ...current, searchTitles: event.target.value }))}
            />
            <Input
              placeholder="Locations, comma separated"
              value={form.locations}
              onChange={(event) => setForm((current) => ({ ...current, locations: event.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Polling interval seconds"
                type="number"
                value={form.pollingIntervalSeconds}
                onChange={(event) => setForm((current) => ({ ...current, pollingIntervalSeconds: event.target.value }))}
              />
              <Input
                placeholder="Recency days"
                type="number"
                value={form.recencyDays}
                onChange={(event) => setForm((current) => ({ ...current, recencyDays: event.target.value }))}
              />
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button className="flex-1" disabled={isSaving} type="submit">
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
                Save watcher
              </Button>
              {providerNeedsFeed(form.provider) ? (
                <Button disabled={isPreviewing} type="button" variant="ghost" onClick={() => void handlePreviewFeed()}>
                  {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                  Preview feed
                </Button>
              ) : null}
              <Button disabled={isRefreshing} onClick={() => void refreshAll()} variant="secondary">
                {isRefreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Refresh telemetry
              </Button>
            </div>
          </form>

          {preview ? (
            <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-cyan-500/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Feed preview</p>
                  <p className="mt-1 text-sm text-slate-300">
                    {preview.matchedCount} matching jobs out of {preview.totalFetched} fetched records
                  </p>
                </div>
                <Badge variant="freshness">{preview.matchedCount} matches</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {preview.jobs.length === 0 ? (
                  <p className="text-sm text-slate-400">No matching jobs mile. Titles, locations, ya recency filter check karo.</p>
                ) : (
                  preview.jobs.map((job, index) => (
                    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3" key={`${job.jobUrl}-${index}`}>
                      <p className="text-sm font-medium text-white">
                        {job.company} · {job.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">{job.location}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">posted {job.postedDate}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Watcher activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Live polling state and cursor health.</h2>
              </div>
              <Badge className="uppercase tracking-[0.14em]" variant="priority">
                {totals.totalDiscoveries} discoveries
              </Badge>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-muted">No watcher telemetry yet.</p>
              ) : (
                activities.map((watcher) => (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={watcher.watcherId}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-white">{watcher.watcherName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {watcher.provider} on {watcher.sourcePlatform}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="uppercase tracking-[0.14em]">{watcher.status}</Badge>
                        <Badge variant="platform">{watcher.provider}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Poll</p>
                        <p className="mt-2 text-sm font-medium text-slate-100">every {watcher.pollingIntervalSeconds}s</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last run</p>
                        <p className="mt-2 text-sm font-medium text-slate-100">{formatTime(watcher.lastRunAt)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">24h discovery</p>
                        <p className="mt-2 text-sm font-medium text-slate-100">
                          {watcher.recentDiscoveryCount} total / {watcher.recentFreshCount} fresh
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Cursor</p>
                        <p className="mt-2 text-sm font-medium text-slate-100">{formatTime(watcher.lastSeenTimestamp)}</p>
                      </div>
                    </div>

                    {watcher.lastError ? (
                      <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                        {watcher.lastError}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        disabled={busyWatcherId === watcher.watcherId || watcher.status === "active"}
                        onClick={() => void handleStatusChange(watcher.watcherId, "active")}
                        variant="secondary"
                      >
                        Activate
                      </Button>
                      <Button
                        disabled={busyWatcherId === watcher.watcherId || watcher.status === "paused"}
                        onClick={() => void handleStatusChange(watcher.watcherId, "paused")}
                        variant="ghost"
                      >
                        Pause
                      </Button>
                      <Button
                        disabled={busyWatcherId === watcher.watcherId}
                        onClick={() => void handleRunWatcher(watcher.watcherId)}
                        variant="cyan"
                      >
                        {busyWatcherId === watcher.watcherId ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4" />}
                        Run now
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Recent discovery stream</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">What watchers actually found.</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className={eventFilter === "all" ? "" : "opacity-70"}
                  onClick={() => void handleEventFilterChange("all")}
                  variant={eventFilter === "all" ? "primary" : "secondary"}
                >
                  All
                </Button>
                <Button
                  className={eventFilter === "job_discovered" ? "" : "opacity-70"}
                  onClick={() => void handleEventFilterChange("job_discovered")}
                  variant={eventFilter === "job_discovered" ? "cyan" : "secondary"}
                >
                  Discovered
                </Button>
                <Button
                  className={eventFilter === "fresh_job_detected" ? "" : "opacity-70"}
                  onClick={() => void handleEventFilterChange("fresh_job_detected")}
                  variant={eventFilter === "fresh_job_detected" ? "violet" : "secondary"}
                >
                  Fresh
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted">No discovery events have been recorded yet.</p>
              ) : (
                recentEvents.map((event) => (
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={event.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {event.company ?? "New job detected"}{event.title ? ` · ${event.title}` : ""}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          {event.watcherName} · {event.provider} · {timeAgo(event.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="platform">{event.sourcePlatform}</Badge>
                        <Badge variant={event.eventType === "fresh_job_detected" ? "priority" : "freshness"}>
                          {event.eventType === "fresh_job_detected" ? "fresh trigger" : "discovered"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
