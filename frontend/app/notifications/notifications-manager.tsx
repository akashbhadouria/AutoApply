"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Job, Notification, NotificationSummaryResult } from "@/lib/api";

interface NotificationFormState {
  type: string;
  title: string;
  message: string;
  channel: Notification["channel"];
  status: Notification["status"];
  relatedJobId: string;
}

const emptyForm: NotificationFormState = {
  type: "",
  title: "",
  message: "",
  channel: "dashboard",
  status: "pending",
  relatedJobId: "",
};

export function NotificationsManager({
  initialNotifications,
  jobs,
}: {
  initialNotifications: Notification[];
  jobs: Job[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [form, setForm] = useState<NotificationFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<NotificationSummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<Notification["channel"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Notification["status"] | "all">("all");

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (channelFilter !== "all" && notification.channel !== channelFilter) {
          return false;
        }
        if (statusFilter !== "all" && notification.status !== statusFilter) {
          return false;
        }
        return true;
      }),
    [channelFilter, notifications, statusFilter],
  );

  async function refreshNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh notifications");
    }
    const payload = (await response.json()) as { data: Notification[] };
    setNotifications(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          message: form.message,
          channel: form.channel,
          status: form.status,
          relatedJobId: form.relatedJobId ? Number(form.relatedJobId) : undefined,
          deliveredAt: form.status === "delivered" ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save notification");
      }

      setForm(emptyForm);
      await refreshNotifications();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save notification");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(id: number, status: Notification["status"]) {
    setError(null);
    setUpdatingId(id);

    try {
      const response = await fetch(`/api/notifications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          deliveredAt: status === "delivered" ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update notification status");
      }

      await refreshNotifications();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update notification");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSummarizeDraft() {
    setError(null);
    setIsSummarizing(true);

    try {
      const response = await fetch("/api/agents/notification-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          message: form.message,
          channel: form.channel,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to summarize notification");
      }

      const payload = (await response.json()) as { data: NotificationSummaryResult };
      setSummaryResult(payload.data);
    } catch (summaryError) {
      setError(summaryError instanceof Error ? summaryError.message : "Failed to summarize notification");
    } finally {
      setIsSummarizing(false);
    }
  }

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notifications Inbox</p>
            <h2 className="text-2xl font-semibold text-ink">Track delivery state separately from operational events.</h2>
            <p className="text-sm text-muted">
              This is the dedicated inbox for workflow alerts across dashboard, email, Telegram, and WhatsApp channels.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Type" required value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} />
            <Input placeholder="Title" required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Message"
              required
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                value={form.channel}
                onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as Notification["channel"] }))}
              >
                <option value="dashboard">dashboard</option>
                <option value="email">email</option>
                <option value="telegram">telegram</option>
                <option value="whatsapp">whatsapp</option>
              </select>
              <select
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Notification["status"] }))}
              >
                <option value="pending">pending</option>
                <option value="delivered">delivered</option>
                <option value="failed">failed</option>
              </select>
            </div>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={form.relatedJobId}
              onChange={(event) => setForm((current) => ({ ...current, relatedJobId: event.target.value }))}
            >
              <option value="">No related job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} - {job.title}
                </option>
              ))}
            </select>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isSummarizing} onClick={handleSummarizeDraft} type="button">
              {isSummarizing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Summarize notification
            </Button>
            <Button className="w-full" disabled={isSaving} type="submit">
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save notification
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Filters</p>
              <p className="mt-2 text-sm text-muted">Slice the inbox by channel and delivery state.</p>
            </div>
            <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{filteredNotifications.length} visible</p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value as Notification["channel"] | "all")}
            >
              <option value="all">all channels</option>
              <option value="dashboard">dashboard</option>
              <option value="email">email</option>
              <option value="telegram">telegram</option>
              <option value="whatsapp">whatsapp</option>
            </select>
            <select
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as Notification["status"] | "all")}
            >
              <option value="all">all statuses</option>
              <option value="pending">pending</option>
              <option value="delivered">delivered</option>
              <option value="failed">failed</option>
            </select>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-300">Pending notifications can be marked delivered or failed from this page without opening the Operations tab.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-300">The notifications worker can still process queue-driven delivery state updates independently.</p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <p>Severity: {summaryResult?.severity ?? "No summary yet"}</p>
              <p className="mt-2">{summaryResult?.summary ?? "Summarize the current draft to get an operational brief."}</p>
              <p className="mt-2">{summaryResult?.recommendedAction ?? "The recommended next action will appear here."}</p>
              {summaryResult ? <p className="mt-2 text-xs">Prompt template: {summaryResult.promptArtifact.templateName}</p> : null}
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden p-2">
        <div className="flex items-center justify-between px-4 pb-4 pt-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Delivery inbox</p>
            <p className="text-sm text-muted">Notifications are stored independently from raw events so delivery state remains explicit.</p>
          </div>
          <p className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-medium text-ink">{notifications.length} total</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Channel</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Related job</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-10 text-muted" colSpan={6}>
                    No notifications match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>{notification.channel}</TableCell>
                    <TableCell>{notification.status}</TableCell>
                    <TableCell>{notification.relatedJobId ?? "None"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                          disabled={updatingId === notification.id}
                          onClick={() => updateStatus(notification.id, "delivered")}
                          type="button"
                        >
                          {updatingId === notification.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                          Deliver
                        </Button>
                        <Button
                          className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink"
                          disabled={updatingId === notification.id}
                          onClick={() => updateStatus(notification.id, "failed")}
                          type="button"
                        >
                          Fail
                        </Button>
                      </div>
                    </TableCell>
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
