"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Referral } from "@/lib/api";

export function OutreachInboxManager({ initialReferrals }: { initialReferrals: Referral[] }) {
  const [referrals, setReferrals] = useState(initialReferrals);
  const [busyReferralId, setBusyReferralId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshReferrals() {
    const response = await fetch("/api/referrals/pending", { cache: "no-store" });
    const payload = (await response.json()) as { data: Referral[] };
    setReferrals(payload.data);
  }

  async function updateStatus(referralId: number, status: Referral["status"]) {
    setBusyReferralId(referralId);
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

      await refreshReferrals();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Failed to update referral");
    } finally {
      setBusyReferralId(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Pending outreach</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Referral requests waiting for a decision.</h2>
        </div>
        <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" onClick={() => void refreshReferrals()}>
          Refresh
        </Button>
      </div>

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

      <div className="mt-6 space-y-4">
        {referrals.length === 0 ? (
          <p className="text-sm text-muted">No pending outreach is waiting in the inbox.</p>
        ) : (
          referrals.map((referral) => (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5" key={referral.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{referral.company}</p>
                  <p className="mt-1 text-sm text-slate-300">{referral.jobTitle}</p>
                </div>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
                  {referral.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{referral.contactName} · {referral.contactRole}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300">
                {referral.outreachMessage}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button disabled={busyReferralId === referral.id} onClick={() => void updateStatus(referral.id, "replied")}>
                  {busyReferralId === referral.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Mark replied
                </Button>
                <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyReferralId === referral.id} onClick={() => void updateStatus(referral.id, "referred")}>
                  {busyReferralId === referral.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Mark referred
                </Button>
                <Button className="bg-transparent px-3 text-ink hover:bg-canvas hover:text-ink" disabled={busyReferralId === referral.id} onClick={() => void updateStatus(referral.id, "no_response")}>
                  {busyReferralId === referral.id ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  No response
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
