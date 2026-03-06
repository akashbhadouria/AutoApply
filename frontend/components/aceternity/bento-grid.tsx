import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function BentoGrid({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-4 md:auto-rows-[20rem] md:grid-cols-3", className)} {...props} />;
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
}: HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  header?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative row-span-1 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition duration-300 hover:border-cyan-400/30 hover:bg-white/[0.08]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_32%)] opacity-80 transition duration-300 group-hover:opacity-100" />
      <div className="relative flex h-full flex-col justify-between gap-4">
        {header}
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  );
}

