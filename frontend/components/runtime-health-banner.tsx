"use client";

import { useEffect, useState } from "react";

type RuntimeStatus = {
  backendUrl: string;
  backendStatus: "healthy" | "degraded";
  detail: string;
};

export function RuntimeHealthBanner({ initialStatus }: { initialStatus?: RuntimeStatus | null }) {
  const [status, setStatus] = useState<RuntimeStatus | null>(initialStatus ?? null);
  const [loading, setLoading] = useState(initialStatus == null);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/runtime-status", { cache: "no-store" });
        const payload = (await response.json()) as { data: RuntimeStatus };

        if (!cancelled) {
          setStatus(payload.data);
        }
      } catch {
        if (!cancelled) {
          setStatus({
            backendUrl: "http://localhost:4000",
            backendStatus: "degraded",
            detail: "Runtime status could not be fetched from the frontend proxy.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStatus();
    const intervalId = window.setInterval(loadStatus, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading && status == null) {
    return (
      <div className="mb-6 rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300 backdrop-blur-xl">
        Checking backend connectivity for this frontend runtime.
      </div>
    );
  }

  if (status == null) {
    return null;
  }

  const tone =
    status.backendStatus === "healthy"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
      : "border-amber-400/30 bg-amber-500/10 text-amber-50";

  const badgeTone =
    status.backendStatus === "healthy"
      ? "bg-emerald-500/20 text-emerald-200"
      : "bg-amber-500/20 text-amber-100";

  return (
    <div className={`mb-6 rounded-[28px] border px-5 py-4 backdrop-blur-xl ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]">Runtime integration</p>
          <p className="mt-2 text-sm">
            {status.detail} <span className="text-white/80">Backend: {status.backendUrl}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeTone}`}>
          {status.backendStatus}
        </span>
      </div>
    </div>
  );
}
