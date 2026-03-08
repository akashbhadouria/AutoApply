"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ArrowLeftRight,
  Bell,
  Bolt,
  Briefcase,
  Flame,
  Home,
  Inbox,
  Link2,
  Radio,
  Send,
  Settings,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  {
    section: null,
    items: [{ href: "/", label: "Dashboard", icon: Home }],
  },
  {
    section: "Discover",
    items: [
      { href: "/fresh-jobs",    label: "Fresh Jobs",   icon: Flame },
      { href: "/jobs",          label: "All Jobs",     icon: Briefcase },
      { href: "/job-watchers",  label: "Watchers",     icon: Radio },
    ],
  },
  {
    section: "Apply",
    items: [
      { href: "/outreach-inbox", label: "Outreach",     icon: Inbox },
      { href: "/referrals",      label: "Referrals",    icon: Users },
      { href: "/applications",   label: "Applications", icon: Send },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/onboarding",          label: "Onboarding",  icon: Sparkles },
      { href: "/profile",             label: "My Profile",  icon: User },
      { href: "/connected-accounts",  label: "Connections", icon: Link2 },
      { href: "/notifications",       label: "Alerts",      icon: Bell },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/automation",    label: "Automation",    icon: Zap },
      { href: "/operations",    label: "Operations",    icon: Activity },
      { href: "/field-mappings", label: "Field Maps",   icon: ArrowLeftRight },
      { href: "/settings",      label: "Settings",      icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col"
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* ── Brand ─────────────────────────── */}
      <div className="flex h-[60px] shrink-0 items-center gap-3 px-5"
           style={{ borderBottom: "1px solid var(--border)" }}>
        <motion.div
          whileHover={{ rotate: 15, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #06B6D4 100%)",
            boxShadow: "0 0 18px rgba(124,58,237,.5)",
          }}
        >
          <Bolt className="size-[18px] text-white" strokeWidth={2.5} />
        </motion.div>

        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-none tracking-tight text-white">AutoApply</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.2em] grad-text-brand">
            AI Engine
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {nav.map((group) => (
          <div key={group.section ?? "__home"} className="mb-1">
            {group.section && (
              <p className="mb-1 mt-3 px-2 text-[10px] font-bold uppercase tracking-[.22em] text-slate-600">
                {group.section}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} className="block">
                  <motion.div
                    className={cn(
                      "relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-[9px] text-sm font-medium transition-colors",
                      active ? "text-white" : "text-slate-500 hover:text-slate-200",
                    )}
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {/* Active background pill */}
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: "linear-gradient(135deg,rgba(124,58,237,.18) 0%,rgba(79,70,229,.12) 100%)",
                            border: "1px solid rgba(124,58,237,.25)",
                          }}
                          initial={{ opacity: 0, scale: .96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: .96 }}
                          transition={{ duration: .15 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Left accent */}
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            width: 3, height: 18,
                            background: "linear-gradient(180deg,#7C3AED,#06B6D4)",
                            boxShadow: "0 0 8px rgba(124,58,237,.7)",
                          }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          transition={{ duration: .2 }}
                        />
                      )}
                    </AnimatePresence>

                    <item.icon
                      className={cn(
                        "relative z-10 size-4 shrink-0",
                        active ? "text-violet-400" : "text-slate-600 group-hover:text-slate-400",
                      )}
                    />
                    <span className="relative z-10 truncate">{item.label}</span>

                    {active && (
                      <motion.span
                        className="relative z-10 ml-auto size-1.5 shrink-0 rounded-full bg-violet-400 dot-pulse"
                        style={{ boxShadow: "0 0 6px rgba(167,139,250,.9)" }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer ────────────────────────── */}
      <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <motion.span
            className="size-2 rounded-full bg-emerald-400"
            style={{ boxShadow: "0 0 7px rgba(16,185,129,.9)" }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <span className="text-[11px] font-medium text-slate-600">System online</span>
        </div>
      </div>
    </aside>
  );
}
