import type { ReactNode } from "react";

import { RuntimeHealthBanner } from "@/components/runtime-health-banner";
import { Card } from "@/components/ui/card";

export function FeaturePageShell({
  badge,
  title,
  description,
  children,
  bullets: _bullets,
}: {
  badge: string;
  title: string;
  description: string;
  bullets?: string[];
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen px-8 py-8">
      <RuntimeHealthBanner />

      {/* Page header */}
      <div className="mb-8">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-1">
          <span className="size-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px rgba(34,211,238,0.8)" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400">{badge}</span>
        </span>

        <h1 className="mb-2 text-3xl font-bold tracking-tight grad-text">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>

        {/* Separator */}
        <div className="mt-6 h-px w-full bg-gradient-to-r from-cyan-500/30 via-violet-500/20 to-transparent" />
      </div>

      {children}
    </main>
  );
}

export function FeaturePageErrorState({
  checks,
  message,
}: {
  checks: string[];
  message: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="border-red-500/20 bg-red-500/[0.04] p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div
            className="size-2 rounded-full bg-red-400"
            style={{ boxShadow: "0 0 8px rgba(248,113,113,0.8)" }}
          />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Runtime Error</p>
        </div>
        <p className="text-sm leading-7 text-slate-200">{message}</p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          The UI shell is healthy, but this page cannot fetch live data from the backend right now.
        </p>
      </Card>

      <Card className="p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recovery Checklist</p>
        <ul className="space-y-3">
          {checks.map((check, i) => (
            <li key={check} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-[10px] font-bold text-violet-400">
                {i + 1}
              </span>
              {check}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
