"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Loader2, Mail, Send, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConnectedAccount, OutreachAttempt, Referral } from "@/lib/api";

function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function defaultChannel(accounts: ConnectedAccount[]): OutreachAttempt["channel"] {
  if (accounts.some((account) => account.provider === "linkedin")) return "linkedin";
  if (accounts.some((account) => account.provider === "gmail" || account.provider === "outlook")) return "email";
  if (accounts.some((account) => account.provider === "telegram")) return "telegram";
  return "whatsapp";
}

function accountSupportsChannel(account: ConnectedAccount, channel: OutreachAttempt["channel"]) {
  if (channel === "email") {
    return account.provider === "gmail" || account.provider === "outlook";
  }

  return account.provider === channel;
}

export function OutreachInboxManager({
  initialReferrals,
  initialConnectedAccounts,
  initialOutreachAttempts,
}: {
  initialReferrals: Referral[];
  initialConnectedAccounts: ConnectedAccount[];
  initialOutreachAttempts: OutreachAttempt[];
}) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [connectedAccounts, setConnectedAccounts] = useState(initialConnectedAccounts);
  const [outreachAttempts, setOutreachAttempts] = useState(initialOutreachAttempts);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelSelections, setChannelSelections] = useState<Record<number, OutreachAttempt["channel"]>>(
    Object.fromEntries(initialReferrals.map((referral) => [referral.id, defaultChannel(initialConnectedAccounts)])),
  );
  const [accountSelections, setAccountSelections] = useState<Record<number, number | "">>({});

  const attemptsByReferral = useMemo(() => {
    return outreachAttempts.reduce<Record<number, OutreachAttempt[]>>((accumulator, attempt) => {
      accumulator[attempt.referralId] ??= [];
      accumulator[attempt.referralId].push(attempt);
      return accumulator;
    }, {});
  }, [outreachAttempts]);

  const counters = useMemo(() => {
    return {
      approvalsPending: outreachAttempts.filter((attempt) => attempt.approvalStatus === "pending_approval").length,
      sent: outreachAttempts.filter((attempt) => attempt.executionStatus === "sent").length,
      drafts: outreachAttempts.filter((attempt) => attempt.executionStatus === "drafted").length,
    };
  }, [outreachAttempts]);

  async function refreshAll() {
    setError(null);
    try {
      const [referralResponse, attemptResponse, accountResponse] = await Promise.all([
        fetch("/api/referrals/pending", { cache: "no-store" }),
        fetch("/api/outreach-attempts?limit=40", { cache: "no-store" }),
        fetch("/api/me/connected-accounts", { cache: "no-store" }),
      ]);

      if (!referralResponse.ok || !attemptResponse.ok || !accountResponse.ok) {
        throw new Error("Unable to refresh outreach inbox");
      }

      const referralPayload = (await referralResponse.json()) as { data: Referral[] };
      const attemptPayload = (await attemptResponse.json()) as { data: OutreachAttempt[] };
      const accountPayload = (await accountResponse.json()) as { data: ConnectedAccount[] };

      setReferrals(referralPayload.data);
      setOutreachAttempts(attemptPayload.data);
      setConnectedAccounts(accountPayload.data);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh outreach inbox");
    }
  }

  async function updateReferralStatus(referralId: number, status: Referral["status"]) {
    setBusyKey(`referral:${referralId}:${status}`);
    setError(null);

    try {
      const response = await fetch(`/api/referrals/${referralId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          repliedAt: status === "replied" ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update outreach status");
      }

      await refreshAll();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update referral");
    } finally {
      setBusyKey(null);
    }
  }

  async function createAttempt(referral: Referral) {
    const channel = channelSelections[referral.id] ?? defaultChannel(connectedAccounts);
    const connectedAccountId =
      accountSelections[referral.id] ||
      connectedAccounts.find((account) => accountSupportsChannel(account, channel))?.id ||
      undefined;
    const linkedAccount = connectedAccountId
      ? connectedAccounts.find((account) => account.id === connectedAccountId) ?? null
      : null;

    setBusyKey(`attempt:create:${referral.id}`);
    setError(null);

    try {
      const response = await fetch("/api/outreach-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralId: referral.id,
          connectedAccountId,
          channel,
          approvalStatus: linkedAccount?.approvalMode === "auto_send" ? "not_required" : "pending_approval",
          executionStatus: "drafted",
          messageSubject: `${referral.company} · ${referral.jobTitle}`,
          messageBody: referral.outreachMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to create outreach attempt");
      }

      await refreshAll();
    } catch (attemptError) {
      setError(attemptError instanceof Error ? attemptError.message : "Failed to create outreach attempt");
    } finally {
      setBusyKey(null);
    }
  }

  async function updateAttemptApproval(outreachAttemptId: number, approvalStatus: "approved" | "rejected" | "not_required") {
    setBusyKey(`approval:${outreachAttemptId}:${approvalStatus}`);
    setError(null);

    try {
      const response = await fetch(`/api/outreach-attempts/${outreachAttemptId}/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalStatus,
          approvedAt: approvalStatus === "approved" || approvalStatus === "not_required" ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update approval");
      }

      await refreshAll();
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : "Failed to update approval");
    } finally {
      setBusyKey(null);
    }
  }

  async function updateAttemptStatus(outreachAttemptId: number, executionStatus: OutreachAttempt["executionStatus"]) {
    setBusyKey(`status:${outreachAttemptId}:${executionStatus}`);
    setError(null);

    try {
      const response = await fetch(`/api/outreach-attempts/${outreachAttemptId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executionStatus,
          sentAt: executionStatus === "sent" ? new Date().toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to update outreach execution");
      }

      await refreshAll();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update outreach execution");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard accent="amber" label="Pending Referrals" sub="need operator action" value={referrals.length} />
        <StatCard accent="violet" label="Approval Queue" sub="waiting for decision" value={counters.approvalsPending} />
        <StatCard accent="emerald" label="Sent Attempts" sub="recorded outreach" value={counters.sent} />
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Pending outreach</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Referral requests, approvals, and send-state in one place.</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="uppercase tracking-[0.14em]">{connectedAccounts.length} connected accounts</Badge>
            <Button onClick={() => void refreshAll()} variant="secondary">
              Refresh
            </Button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-6 space-y-5">
          {referrals.length === 0 ? (
            <p className="text-sm text-muted">No pending outreach is waiting in the inbox.</p>
          ) : (
            referrals.map((referral) => {
              const attempts = attemptsByReferral[referral.id] ?? [];
              const selectedChannel = channelSelections[referral.id] ?? defaultChannel(connectedAccounts);
              const availableAccounts = connectedAccounts.filter((account) =>
                accountSupportsChannel(account, selectedChannel),
              );

              return (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5" key={referral.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{referral.company}</p>
                      <p className="mt-1 text-sm text-slate-300">{referral.jobTitle}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="referral">{referral.status}</Badge>
                      <Badge variant="platform">manual control</Badge>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-300">
                    {referral.contactName} · {referral.contactRole}
                  </p>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                    {referral.outreachMessage}
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                    <select
                      className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition-all focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                      value={selectedChannel}
                      onChange={(event) =>
                        setChannelSelections((current) => ({
                          ...current,
                          [referral.id]: event.target.value as OutreachAttempt["channel"],
                        }))
                      }
                    >
                      <option value="linkedin">linkedin</option>
                      <option value="email">email</option>
                      <option value="telegram">telegram</option>
                      <option value="whatsapp">whatsapp</option>
                    </select>

                    <select
                      className="h-10 rounded-xl border border-white/10 bg-slate-950/80 px-3 text-sm text-slate-100 outline-none transition-all focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/10"
                      value={accountSelections[referral.id] ?? ""}
                      onChange={(event) =>
                        setAccountSelections((current) => ({
                          ...current,
                          [referral.id]: event.target.value ? Number(event.target.value) : "",
                        }))
                      }
                    >
                      <option value="">Auto-select account</option>
                      {availableAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.accountLabel} · {account.provider}
                        </option>
                      ))}
                    </select>

                    <Button
                      disabled={busyKey === `attempt:create:${referral.id}`}
                      onClick={() => void createAttempt(referral)}
                    >
                      {busyKey === `attempt:create:${referral.id}` ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                      Create approval draft
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button disabled={busyKey === `referral:${referral.id}:replied`} onClick={() => void updateReferralStatus(referral.id, "replied")} variant="cyan">
                      {busyKey === `referral:${referral.id}:replied` ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
                      Mark replied
                    </Button>
                    <Button disabled={busyKey === `referral:${referral.id}:referred`} onClick={() => void updateReferralStatus(referral.id, "referred")} variant="secondary">
                      Mark referred
                    </Button>
                    <Button disabled={busyKey === `referral:${referral.id}:no_response`} onClick={() => void updateReferralStatus(referral.id, "no_response")} variant="ghost">
                      No response
                    </Button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {attempts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-500">
                        No outreach execution draft yet. Create one to start approval and send tracking.
                      </div>
                    ) : (
                      attempts.map((attempt) => (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4" key={attempt.id}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                {attempt.connectedAccountLabel ?? "Unlinked account"} · {attempt.channel}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                requested {timeAgo(attempt.requestedAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge>{attempt.approvalStatus}</Badge>
                              <Badge>{attempt.executionStatus}</Badge>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-slate-300">{attempt.messageBody}</p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              disabled={busyKey === `approval:${attempt.id}:approved`}
                              onClick={() => void updateAttemptApproval(attempt.id, "approved")}
                              variant="primary"
                            >
                              {busyKey === `approval:${attempt.id}:approved` ? <Loader2 className="size-4 animate-spin" /> : <UserRound className="size-4" />}
                              Approve
                            </Button>
                            <Button
                              disabled={busyKey === `approval:${attempt.id}:rejected`}
                              onClick={() => void updateAttemptApproval(attempt.id, "rejected")}
                              variant="ghost"
                            >
                              Reject
                            </Button>
                            <Button
                              disabled={busyKey === `status:${attempt.id}:queued`}
                              onClick={() => void updateAttemptStatus(attempt.id, "queued")}
                              variant="secondary"
                            >
                              <Mail className="size-4" />
                              Queue send
                            </Button>
                            <Button
                              disabled={busyKey === `status:${attempt.id}:sent`}
                              onClick={() => void updateAttemptStatus(attempt.id, "sent")}
                              variant="cyan"
                            >
                              {busyKey === `status:${attempt.id}:sent` ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                              Mark sent
                            </Button>
                            <Button
                              disabled={busyKey === `status:${attempt.id}:failed`}
                              onClick={() => void updateAttemptStatus(attempt.id, "failed")}
                              variant="ghost"
                            >
                              Mark failed
                            </Button>
                          </div>

                          {attempt.errorMessage ? (
                            <p className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                              {attempt.errorMessage}
                            </p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
