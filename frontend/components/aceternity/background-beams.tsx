"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

const beams = [
  "from-cyan-500/0 via-cyan-500/40 to-cyan-500/0",
  "from-fuchsia-500/0 via-fuchsia-500/35 to-fuchsia-500/0",
  "from-emerald-400/0 via-emerald-400/30 to-emerald-400/0",
  "from-sky-500/0 via-sky-500/30 to-sky-500/0",
];

export function BackgroundBeams({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_25%)]" />
      {beams.map((beam, index) => (
        <motion.div
          animate={{
            opacity: [0.15, 0.55, 0.2],
            x: [0, index % 2 === 0 ? 40 : -40, 0],
          }}
          className={cn(
            "absolute top-0 h-full w-px bg-gradient-to-b blur-[1px]",
            beam,
          )}
          initial={{ opacity: 0.2 }}
          key={beam}
          style={{
            left: `${18 + index * 20}%`,
          }}
          transition={{
            duration: 7 + index,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      ))}
    </div>
  );
}

