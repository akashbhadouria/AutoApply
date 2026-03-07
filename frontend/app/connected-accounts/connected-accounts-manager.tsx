"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConnectedAccount } from "@/lib/api";

const emptyForm = {
  linkedin: "",
  gmail: "",
  telegram: "",
  whatsapp: "",
};

function buildAccountPayloads(form: typeof emptyForm) {
  return [
    form.linkedin.trim()
      ? {
          provider: "linkedin" as const,
          accountLabel: "Primary LinkedIn",
          accountIdentifier: form.linkedin.trim(),
        }
      : null,
    form.gmail.trim()
      ? {
          provider: "gmail" as const,
          accountLabel: "Primary Gmail",
          accountIdentifier: form.gmail.trim(),
        }
      : null,
    form.telegram.trim()
      ? {
          provider: "telegram" as const,
          accountLabel: "Primary Telegram",
          accountIdentifier: form.telegram.trim(),
        }
      : null,
    form.whatsapp.trim()
      ? {
          provider: "whatsapp" as const,
          accountLabel: "Primary WhatsApp",
          accountIdentifier: form.whatsapp.trim(),
        }
      : null,
  ].filter(Boolean) as Array<{
    provider: ConnectedAccount["provider"];
    accountLabel: string;
    accountIdentifier: string;
  }>;
}

async function parseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function ConnectedAccountsManager({ initialAccounts }: { initialAccounts: ConnectedAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groupedAccounts = useMemo(
    () => ({
      linkedin: accounts.filter((account) => account.provider === "linkedin"),
      gmail: accounts.filter((account) => account.provider === "gmail"),
      telegram: accounts.filter((account) => account.provider === "telegram"),
      whatsapp: accounts.filter((account) => account.provider === "whatsapp"),
    }),
    [accounts],
  );

  async function refreshAccounts() {
    const response = await fetch("/api/me/connected-accounts", { cache: "no-store" });
    const payload = (await response.json()) as { data: ConnectedAccount[] };
    setAccounts(payload.data);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      const payloads = buildAccountPayloads(form);

      if (payloads.length === 0) {
        throw new Error("Kam se kam ek account detail do: LinkedIn, Gmail, Telegram, ya WhatsApp.");
      }

      for (const payload of payloads) {
        const response = await fetch("/api/me/connected-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            connectionStatus: "pending",
            approvalMode: "manual_approval",
          }),
        });

        if (!response.ok) {
          throw new Error(await parseError(response, `Unable to save ${payload.provider} connection`));
        }
      }

      setForm(emptyForm);
      await refreshAccounts();
      setMessage("Provided accounts saved. Ab inko actual connect/verify flow se bind karna hoga.");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to save account details");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Connection identity</p>
          <h2 className="text-2xl font-semibold text-ink">Bas jo IDs hain woh do. Baaki connect flow baad me hoga.</h2>
          <p className="text-sm text-muted">
            LinkedIn profile, Gmail address, Telegram username/chat ID, ya WhatsApp number me se jo available hai woh do. Agar kuch bhi nahi doge to AutoApply outreach ya alerts route nahi kar paayega.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            placeholder="LinkedIn profile URL ya public ID"
            value={form.linkedin}
            onChange={(event) => setForm((current) => ({ ...current, linkedin: event.target.value }))}
          />
          <Input
            placeholder="Gmail address"
            type="email"
            value={form.gmail}
            onChange={(event) => setForm((current) => ({ ...current, gmail: event.target.value }))}
          />
          <Input
            placeholder="Telegram username, number, ya chat ID"
            value={form.telegram}
            onChange={(event) => setForm((current) => ({ ...current, telegram: event.target.value }))}
          />
          <Input
            placeholder="WhatsApp number with country code"
            value={form.whatsapp}
            onChange={(event) => setForm((current) => ({ ...current, whatsapp: event.target.value }))}
          />

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted">
            Minimum requirement:
            <br />
            at least one identifier dena zaroori hai. Save ke baad jo provider diya hai usko later actual connect/verify state me le jana padega.
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

          <Button className="w-full" disabled={isSaving} type="submit">
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save provided accounts
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Saved connection targets</p>
        <div className="mt-4 grid gap-4">
          {(["linkedin", "gmail", "telegram", "whatsapp"] as const).map((provider) => {
            const items = groupedAccounts[provider];

            return (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" key={provider}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-ink">{provider}</p>
                  <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">No {provider} target saved yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {items.map((account) => (
                      <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3" key={account.id}>
                        <p className="text-sm text-slate-200">{account.accountIdentifier ?? "No identifier saved."}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                          status: {account.connectionStatus} · approval: {account.approvalMode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
