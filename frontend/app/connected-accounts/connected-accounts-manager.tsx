"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConnectedAccount } from "@/lib/api";

const emptyForm = {
  provider: "linkedin" as ConnectedAccount["provider"],
  accountLabel: "",
  connectionStatus: "pending" as ConnectedAccount["connectionStatus"],
  approvalMode: "manual_approval" as ConnectedAccount["approvalMode"],
  accountIdentifier: "",
};

export function ConnectedAccountsManager({ initialAccounts }: { initialAccounts: ConnectedAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshAccounts() {
    const response = await fetch("/api/me/connected-accounts", { cache: "no-store" });
    const payload = (await response.json()) as { data: ConnectedAccount[] };
    setAccounts(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/me/connected-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          accountIdentifier: form.accountIdentifier || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save connected account");
      }

      setForm(emptyForm);
      await refreshAccounts();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save account");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Add account</p>
          <h2 className="text-2xl font-semibold text-ink">Outreach-capable connection state.</h2>
          <p className="text-sm text-muted">For now this models the account and approval policy. Real send automation will sit on top of this contract later.</p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value as ConnectedAccount["provider"] }))}>
            <option value="linkedin">linkedin</option>
            <option value="gmail">gmail</option>
            <option value="outlook">outlook</option>
            <option value="telegram">telegram</option>
            <option value="whatsapp">whatsapp</option>
          </select>
          <Input placeholder="Primary LinkedIn" value={form.accountLabel} onChange={(event) => setForm((current) => ({ ...current, accountLabel: event.target.value }))} />
          <Input placeholder="Account identifier / email / profile" value={form.accountIdentifier} onChange={(event) => setForm((current) => ({ ...current, accountIdentifier: event.target.value }))} />
          <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={form.connectionStatus} onChange={(event) => setForm((current) => ({ ...current, connectionStatus: event.target.value as ConnectedAccount["connectionStatus"] }))}>
            <option value="pending">pending</option>
            <option value="connected">connected</option>
            <option value="degraded">degraded</option>
            <option value="disconnected">disconnected</option>
          </select>
          <select className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 text-sm text-ink outline-none" value={form.approvalMode} onChange={(event) => setForm((current) => ({ ...current, approvalMode: event.target.value as ConnectedAccount["approvalMode"] }))}>
            <option value="manual_approval">manual_approval</option>
            <option value="auto_send">auto_send</option>
          </select>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <Button className="w-full" disabled={isSaving} type="submit">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save account
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Connected accounts</p>
        <div className="mt-4 space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted">No accounts added yet.</p>
          ) : (
            accounts.map((account) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={account.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{account.accountLabel}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{account.provider}</p>
                  </div>
                  <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
                    {account.connectionStatus}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">{account.accountIdentifier ?? "No account identifier saved."}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">approval: {account.approvalMode}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
