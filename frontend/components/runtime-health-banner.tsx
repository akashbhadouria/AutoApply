"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type RuntimeStatus = {
  backendUrl: string;
  backendStatus: "healthy" | "degraded";
  detail: string;
  services: Array<{
    label: string;
    status: "healthy" | "degraded";
    detail: string;
  }>;
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
        if (!cancelled) setStatus(payload.data);
      } catch {
        if (!cancelled) {
          setStatus({
            backendUrl: "http://localhost:4000",
            backendStatus: "degraded",
            detail: "Runtime status could not be fetched.",
            services: [{ label: "Backend", status: "degraded", detail: "Proxy unavailable." }],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();
    const id = window.setInterval(loadStatus, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <AnimatePresence>
      {(loading || status) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          {loading && !status ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <motion.div
                className="size-1.5 rounded-full bg-slate-600"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-xs text-slate-500">Checking backend connectivity…</p>
            </div>
          ) : status ? (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                status.backendStatus === "healthy"
                  ? "border-emerald-500/20 bg-emerald-500/[0.05]"
                  : "border-amber-500/20 bg-amber-500/[0.05]"
              }`}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className={`size-2 shrink-0 rounded-full ${
                    status.backendStatus === "healthy" ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                  style={{
                    boxShadow:
                      status.backendStatus === "healthy"
                        ? "0 0 8px rgba(52,211,153,0.8)"
                        : "0 0 8px rgba(251,191,36,0.8)",
                  }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
                <p className="text-xs text-slate-300">{status.detail}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {status.services.map((svc) => (
                  <span
                    key={svc.label}
                    title={svc.detail}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] ${
                      svc.status === "healthy"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {svc.label}
                  </span>
                ))}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${
                    status.backendStatus === "healthy"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-amber-500/20 text-amber-100"
                  }`}
                >
                  {status.backendStatus}
                </span>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
