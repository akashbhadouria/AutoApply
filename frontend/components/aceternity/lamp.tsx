"use client";

import type { HTMLAttributes } from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

export function LampContainer({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 px-6 py-16 shadow-[0_0_120px_rgba(14,165,233,0.12)]", className)}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
      <motion.div
        animate={{ opacity: [0.45, 0.95, 0.5] }}
        className="absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[90px]"
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.25] }}
        className="absolute left-1/2 top-8 h-72 w-[32rem] -translate-x-1/2 bg-gradient-to-b from-cyan-300/20 to-transparent blur-3xl"
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

