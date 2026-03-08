"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConnectedAccount } from "@/lib/api";
import { capturePlatformSessionViaExtension, detectAutoApplyExtension } from "@/lib/platform-extension";

type PlatformProvider = "linkedin" | "naukri" | "instahyre" | "hirist";

const platforms: Array<{
  provider: PlatformProvider;
  label: string;
  description: string;
  helper: string;
  beta?: boolean;
}> = [
  {
    provider: "linkedin",
    label: "LinkedIn",
    description: "Highest-demand platform with strict guardrails.",
    helper: "25 Easy Apply + 5 Full Apply per day, with backend-managed pacing.",
    beta: true,
  },
  {
    provider: "naukri",
    label: "Naukri",
    description: "High-volume India source with HTTP-first routes.",
    helper: "Strong launch platform for efficient application throughput.",
  },
  {
    provider: "instahyre",
    label: "Instahyre",
    description: "Efficient invite-driven channel with low operating cost.",
    helper: "Best suited for low-friction HTTP automation.",
  },
  {
    provider: "hirist",
    label: "Hirist",
    description: "Useful India tech-jobs source with fallback browser handling.",
    helper: "Adds volume without exposing scheduler controls to the user.",
  },
];

async function parseError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

function latestAccountsByProvider(accounts: ConnectedAccount[]) {
  const map = new Map<string, ConnectedAccount>();

  for (const account of accounts) {
    if (!map.has(account.provider)) {
      map.set(account.provider, account);
    }
  }

  return map;
}

export function ConnectedAccountsManager({ initialAccounts }: { initialAccounts: ConnectedAccount[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [identifiers, setIdentifiers] = useState<Record<PlatformProvider, string>>({
    linkedin: "",
    naukri: "",
    instahyre: "",
    hirist: "",
  });
  const [linkedinConsent, setLinkedinConsent] = useState(false);
  const [isSaving, setIsSaving] = useState<PlatformProvider | null>(null);
  const [extensionReady, setExtensionReady] = useState(false);
  const [checkingExtension, setCheckingExtension] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accountMap = useMemo(() => latestAccountsByProvider(accounts), [accounts]);

  useEffect(() => {
    let cancelled = false;

    void detectAutoApplyExtension().then((ready) => {
      if (cancelled) {
        return;
      }
      setExtensionReady(ready);
      setCheckingExtension(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function connectPlatform(provider: PlatformProvider) {
    setError(null);
    setMessage(null);

    if (provider === "linkedin" && !linkedinConsent) {
      setError("LinkedIn refresh ya connect se pehle consent required hai.");
      return;
    }

    if (!extensionReady) {
      setError("AutoApply Chrome extension detect nahi hui. Load the extension and keep the platform tab logged in.");
      return;
    }

    setIsSaving(provider);

    try {
      await capturePlatformSessionViaExtension(provider);
      const accountsResponse = await fetch("/api/me/connected-accounts", { cache: "no-store" });
      if (!accountsResponse.ok) {
        throw new Error(await parseError(accountsResponse, "Platform session captured but connected accounts could not refresh."));
      }
      const accountsPayload = (await accountsResponse.json()) as { data: ConnectedAccount[] };
      setAccounts(accountsPayload.data);
      setMessage(`${platforms.find((platform) => platform.provider === provider)?.label ?? provider} connected via extension.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : `Unable to connect ${provider}`);
    } finally {
      setIsSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Automation Gate</p>
            <h2 className="text-2xl font-semibold text-ink">AutoApply uses every connected platform automatically.</h2>
            <p className="text-sm text-muted">
              This hub is for connection state only. Scheduling, throttling, retries, and platform pacing remain in the backend.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Extension status</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {checkingExtension ? "Checking..." : extensionReady ? "Ready" : "Missing"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {extensionReady ? "You can capture platform sessions now." : "Load the unpacked AutoApply Chrome extension first."}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Connected now</p>
            <p className="mt-1 text-lg font-semibold text-white">
              {platforms.filter((platform) => accountMap.get(platform.provider)?.connectionStatus !== "disconnected" && accountMap.get(platform.provider)).length}
              {" / "}
              {platforms.length}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {platforms.map((platform) => {
          const account = accountMap.get(platform.provider);
          const isConnected = account && account.connectionStatus !== "disconnected";
          const busy = isSaving === platform.provider;

          return (
            <Card className="p-6" key={platform.provider}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold text-white">{platform.label}</p>
                    {platform.beta ? (
                      <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                        Beta
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{platform.description}</p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isConnected ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-500/10 text-slate-300"
                  }`}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>
              </div>

              <p className="mt-4 text-xs text-slate-400">{platform.helper}</p>
              <Input
                className="mt-4"
                placeholder={`${platform.label} profile URL, account ID, or handle`}
                value={identifiers[platform.provider]}
                onChange={(event) =>
                  setIdentifiers((current) => ({
                    ...current,
                    [platform.provider]: event.target.value,
                  }))
                }
              />

              {platform.provider === "linkedin" ? (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-200" />
                    <label className="flex items-start gap-3 text-xs text-amber-100">
                      <input checked={linkedinConsent} type="checkbox" onChange={(event) => setLinkedinConsent(event.target.checked)} />
                      <span>I understand LinkedIn automation is guarded, capped, and still carries account-risk exposure.</span>
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {account?.accountIdentifier ? `Saved as ${account.accountIdentifier}` : "No account identifier saved yet."}
                </p>
                <Button disabled={busy || !extensionReady || (platform.provider === "linkedin" && !linkedinConsent)} type="button" onClick={() => void connectPlatform(platform.provider)}>
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {isConnected ? "Refresh" : "Connect"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      {!error && !message ? (
        <p className="text-sm text-slate-400">
          At least one connected platform is required before AutoApply can discover or apply to jobs on the user&apos;s behalf.
        </p>
      ) : null}
    </div>
  );
}
