import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-slate-100",
        "outline-none transition-all duration-200 placeholder:text-slate-600",
        "focus:border-violet-500/40 focus:bg-white/[0.06] focus:ring-2 focus:ring-violet-500/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
