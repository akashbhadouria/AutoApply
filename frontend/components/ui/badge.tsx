import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ── Config ────────────────────────────────────── */
type Style = { pill: string; dot?: string };

const appStatus: Record<string, Style> = {
  pending:   { pill: "bg-slate-500/20  text-slate-300  border-slate-500/25" },
  applied:   { pill: "bg-sky-500/20    text-sky-200    border-sky-500/30",    dot: "bg-sky-400" },
  interview: { pill: "bg-violet-500/25 text-violet-200 border-violet-500/30", dot: "bg-violet-400" },
  offer:     { pill: "bg-emerald-500/25 text-emerald-200 border-emerald-500/30", dot: "bg-emerald-400" },
  rejected:  { pill: "bg-rose-500/20   text-rose-300   border-rose-500/25" },
};

const refStatus: Record<string, Style> = {
  pending:     { pill: "bg-amber-500/20  text-amber-200  border-amber-500/30" },
  replied:     { pill: "bg-sky-500/20    text-sky-200    border-sky-500/30",    dot: "bg-sky-400" },
  referred:    { pill: "bg-emerald-500/25 text-emerald-200 border-emerald-500/30", dot: "bg-emerald-400" },
  no_response: { pill: "bg-slate-500/20  text-slate-400  border-slate-500/25" },
};

const platform: Record<string, Style> = {
  linkedin:     { pill: "bg-blue-600/20   text-blue-300   border-blue-500/25" },
  naukri:       { pill: "bg-yellow-500/20 text-yellow-300 border-yellow-500/25" },
  instahyre:    { pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/25" },
  hirist:       { pill: "bg-orange-500/20 text-orange-300 border-orange-500/25" },
  company_site: { pill: "bg-slate-500/20  text-slate-300  border-slate-500/25" },
};

const freshness: Record<string, Style> = {
  fresh:    { pill: "bg-emerald-500/25 text-emerald-200 border-emerald-500/30", dot: "bg-emerald-400" },
  recent:   { pill: "bg-sky-500/20     text-sky-200     border-sky-500/25" },
  standard: { pill: "bg-slate-500/15   text-slate-400   border-slate-500/20" },
};

const priority: Record<string, Style> = {
  high:   { pill: "bg-rose-500/20    text-rose-300   border-rose-500/25",   dot: "bg-rose-400" },
  normal: { pill: "bg-slate-500/15   text-slate-400  border-slate-500/20" },
  low:    { pill: "bg-slate-500/10   text-slate-500  border-slate-500/15" },
};

const fallback: Style = { pill: "bg-slate-500/15 text-slate-400 border-slate-500/20" };

/* ── Component ─────────────────────────────────── */
interface BadgeProps {
  label?: string;
  children?: ReactNode;
  variant?: "app" | "application" | "referral" | "platform" | "freshness" | "priority";
  className?: string;
}

const maps = { app: appStatus, application: appStatus, referral: refStatus, platform, freshness, priority };

export function Badge({ label, children, variant, className }: BadgeProps) {
  const resolvedLabel =
    label ??
    (typeof children === "string" || typeof children === "number" ? String(children) : "");
  const safeLabel = resolvedLabel || "unknown";
  const key = safeLabel.toLowerCase().replace(/\s+/g, "_");
  const style = variant ? (maps[variant]?.[key] ?? fallback) : fallback;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px]",
        "text-[11px] font-semibold capitalize leading-none",
        style.pill,
        className,
      )}
    >
      {style.dot && (
        <span className={cn("size-[5px] shrink-0 rounded-full", style.dot)} />
      )}
      {children ?? safeLabel.replace(/_/g, " ")}
    </span>
  );
}
