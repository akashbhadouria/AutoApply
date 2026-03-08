import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const variants = {
  primary: [
    "text-white font-semibold",
    "bg-gradient-to-r from-violet-600 to-indigo-600",
    "hover:from-violet-500 hover:to-indigo-500",
    "shadow-[0_0_20px_rgba(124,58,237,.35)] hover:shadow-[0_0_28px_rgba(124,58,237,.55)]",
    "border-0",
  ].join(" "),

  secondary: [
    "text-slate-200 font-medium",
    "bg-white/[.06] hover:bg-white/[.1]",
    "border border-white/10 hover:border-white/20",
  ].join(" "),

  ghost: [
    "text-slate-400 hover:text-slate-100 font-medium",
    "bg-transparent hover:bg-white/[.06]",
    "border border-transparent hover:border-white/10",
  ].join(" "),

  danger: [
    "text-rose-300 font-medium",
    "bg-rose-500/10 hover:bg-rose-500/20",
    "border border-rose-500/25 hover:border-rose-400/40",
    "hover:shadow-[0_0_16px_rgba(244,63,94,.25)]",
  ].join(" "),

  violet: [
    "text-violet-300 font-medium",
    "bg-violet-500/12 hover:bg-violet-500/20",
    "border border-violet-500/25 hover:border-violet-400/40",
    "hover:shadow-[0_0_16px_rgba(124,58,237,.3)]",
  ].join(" "),

  cyan: [
    "text-cyan-300 font-medium",
    "bg-cyan-500/10 hover:bg-cyan-500/20",
    "border border-cyan-500/25 hover:border-cyan-400/40",
    "hover:shadow-[0_0_16px_rgba(6,182,212,.3)]",
  ].join(" "),
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm:  "h-8  px-3 text-xs  rounded-lg",
  md:  "h-10 px-4 text-sm  rounded-xl",
  lg:  "h-12 px-6 text-base rounded-xl",
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, asChild = false, type = "button", variant = "primary", size = "md", ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50",
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
