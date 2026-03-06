"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ApplicationSession, Job, Notification } from "@/lib/api";

interface SessionFormState {
  jobId: string;
  formUrl: string;
  missingField: string;
  filledFieldsJson: string;
  status: ApplicationSession["status"];
}

interface NotificationFormState {
  type: string;
  title: string;
  message: string;
  channel: Notification["channel"];
  status: Notification["status"];
  relatedJobId: string;
}

const emptySessionForm: SessionFormState = {
  jobId: "",
  formUrl: "",
  missingField: "",
  filledFieldsJson: "{}",
  status: "paused",
};

const emptyNotificationForm: NotificationFormState = {
  type: "",
  title: "",
  message: "",
  channel: "dashboard",
  status: "pending",
  relatedJobId: "",
};

export function OperationsManager({
  initialSessions,
  initialNotifications,
  jobs,
}: {
  initialSessions: ApplicationSession[];
  initialNotifications: Notification[];
  jobs: Job[];
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(emptySessionForm);
  const [notificationForm, setNotificationForm] = useState<NotificationFormState>(emptyNotificationForm);
  const [error, setError] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);

  const jobOptions = useMemo(
    () => jobs.map((job) => ({ id: job.id, label: `${job.company} - ${job.title} - ${job.location}` })),
    [jobs],
  );

  async function refreshSessions() {
    const response = await fetch("/api/application-sessions", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh sessions");
    }
    const payload = (await response.json()) as { data: ApplicationSession[] };
    setSessions(payload.data);
  }

  async function refreshNotifications() {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to refresh notifications");
    }
    const payload = (await response.json()) as { data: Notification[] };
    setNotifications(payload.data);
  }

  async function handleSessionSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavingSession(true);

    try {
      const filledFields = JSON.parse(sessionForm.filledFieldsJson) as Record<string, string>;
      const response = await fetch("/api/application-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(sessionForm.jobId),
          formUrl: sessionForm.formUrl,
          filledFields,
          missingField: sessionForm.missingField,
          status: sessionForm.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save application session");
      }

      setSessionForm(emptySessionForm);
      await refreshSessions();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save session");
    } finally {
      setSavingSession(false);
    }
  }

  async function handleNotificationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSavingNotification(true);

    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: notificationForm.type,
          title: notificationForm.title,
          message: notificationForm.message,
          channel: notificationForm.channel,
          status: notificationForm.status,
          relatedJobId: notificationForm.relatedJobId ? Number(notificationForm.relatedJobId) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save notification");
      }

      setNotificationForm(emptyNotificationForm);
      await refreshNotifications();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save notification");
    } finally {
      setSavingNotification(false);
    }
  }

  useEffect(() => {
    setSessions(initialSessions);
    setNotifications(initialNotifications);
  }, [initialNotifications, initialSessions]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Paused Sessions</p>
            <h2 className="text-2xl font-semibold text-ink">Store resumable ATS interruptions explicitly.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSessionSubmit}>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              required
              value={sessionForm.jobId}
              onChange={(event) => setSessionForm((current) => ({ ...current, jobId: event.target.value }))}
            >
              <option value="">Select job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>
            <Input placeholder="Form URL" required value={sessionForm.formUrl} onChange={(event) => setSessionForm((current) => ({ ...current, formUrl: event.target.value }))} />
            <Input placeholder="Missing field" required value={sessionForm.missingField} onChange={(event) => setSessionForm((current) => ({ ...current, missingField: event.target.value }))} />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder='{"name":"Akash Bhadouria"}'
              required
              value={sessionForm.filledFieldsJson}
              onChange={(event) => setSessionForm((current) => ({ ...current, filledFieldsJson: event.target.value }))}
            />
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={sessionForm.status}
              onChange={(event) => setSessionForm((current) => ({ ...current, status: event.target.value as ApplicationSession["status"] }))}
            >
              <option value="paused">paused</option>
              <option value="ready_to_resume">ready_to_resume</option>
              <option value="completed">completed</option>
            </select>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={savingSession} type="submit">
              {savingSession ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save paused session
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notifications</p>
            <h2 className="text-2xl font-semibold text-ink">Capture events the later workers and n8n flows will deliver.</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleNotificationSubmit}>
            <Input placeholder="Type" required value={notificationForm.type} onChange={(event) => setNotificationForm((current) => ({ ...current, type: event.target.value }))} />
            <Input placeholder="Title" required value={notificationForm.title} onChange={(event) => setNotificationForm((current) => ({ ...current, title: event.target.value }))} />
            <textarea
              className="min-h-28 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
              placeholder="Message"
              required
              value={notificationForm.message}
              onChange={(event) => setNotificationForm((current) => ({ ...current, message: event.target.value }))}
            />
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={notificationForm.channel}
              onChange={(event) => setNotificationForm((current) => ({ ...current, channel: event.target.value as Notification["channel"] }))}
            >
              <option value="dashboard">dashboard</option>
              <option value="email">email</option>
              <option value="telegram">telegram</option>
              <option value="whatsapp">whatsapp</option>
            </select>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={notificationForm.status}
              onChange={(event) => setNotificationForm((current) => ({ ...current, status: event.target.value as Notification["status"] }))}
            >
              <option value="pending">pending</option>
              <option value="delivered">delivered</option>
              <option value="failed">failed</option>
            </select>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-ink outline-none transition focus:border-accent"
              value={notificationForm.relatedJobId}
              onChange={(event) => setNotificationForm((current) => ({ ...current, relatedJobId: event.target.value }))}
            >
              <option value="">No related job</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.label}
                </option>
              ))}
            </select>
            <Button className="w-full" disabled={savingNotification} type="submit">
              {savingNotification ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save notification
            </Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Paused sessions</p>
            <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{sessions.length} sessions</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Company</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Missing field</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={4}>
                      No paused sessions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.company}</TableCell>
                      <TableCell>{session.title}</TableCell>
                      <TableCell>{session.missingField}</TableCell>
                      <TableCell>{session.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 pb-4 pt-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Notifications</p>
            <p className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-ink">{notifications.length} notifications</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Title</TableHeaderCell>
                  <TableHeaderCell>Channel</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-10 text-muted" colSpan={4}>
                      No notifications yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">{notification.type}</TableCell>
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>{notification.channel}</TableCell>
                      <TableCell>{notification.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
