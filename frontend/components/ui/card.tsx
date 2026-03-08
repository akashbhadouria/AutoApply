import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-200",
        className,
      )}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
      }}
      {...props}
    />
  );
}

/** A card with a coloured accent strip on the left edge */
export function AccentCard({
  accent = "violet",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: "violet" | "cyan" | "emerald" | "rose" | "amber" }) {
  const strip: Record<string, string> = {
    violet:  "from-violet-500 to-indigo-500",
    cyan:    "from-cyan-400   to-blue-500",
    emerald: "from-emerald-400 to-teal-500",
    rose:    "from-rose-500   to-pink-500",
    amber:   "from-amber-400  to-orange-500",
  };
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl transition-all duration-200", className)}
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      {...props}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b", strip[accent])}
        style={{ boxShadow: `0 0 12px var(--${accent})` }}
      />
      {props.children}
    </div>
  );
}

/** Metric / stat card with a large number */
export function StatCard({
  label,
  value,
  sub,
  accent = "violet",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "violet" | "cyan" | "emerald" | "rose" | "amber";
}) {
  const colors: Record<string, string> = {
    violet:  "text-violet-400",
    cyan:    "text-cyan-400",
    emerald: "text-emerald-400",
    rose:    "text-rose-400",
    amber:   "text-amber-400",
  };
  return (
    <Card className="p-5">
      <p className={cn("text-[11px] font-bold uppercase tracking-[.2em]", colors[accent])}>{label}</p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}
