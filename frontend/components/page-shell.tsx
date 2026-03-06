import Link from "next/link";
import type { ReactNode } from "react";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { LampContainer } from "@/components/aceternity/lamp";
import { Card } from "@/components/ui/card";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/profile", label: "Profile" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/referrals", label: "Referrals" },
  { href: "/operations", label: "Operations" },
  { href: "/automation", label: "Automation" },
  { href: "/field-mappings", label: "Field Mappings" },
];

export function FeaturePageShell({
  badge,
  title,
  description,
  bullets,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  bullets: string[];
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <BackgroundBeams />
      <div className="relative z-10 mx-auto max-w-7xl">
        <Card className="mb-6 overflow-hidden border-white/15 bg-slate-950/55 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">AutoApply Control Surface</p>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Frontend automation console for jobs, referrals, ATS sessions, queues, and self-learning mappings.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <Link
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </Card>

        <div className="mb-8">
          <LampContainer>
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-300">{badge}</p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-6xl">{title}</h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{description}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-300">
                <Link className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 hover:bg-cyan-400/20" href="/">
                  Overview
                </Link>
                <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10" href="/automation">
                  Automation
                </Link>
                <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10" href="/field-mappings">
                  Field Mappings
                </Link>
              </div>
            </div>
          </LampContainer>
        </div>

        <BentoGrid className="mb-8 md:grid-cols-4">
          {bullets.map((bullet, index) => (
            <BentoGridItem
              className={index === 0 ? "md:col-span-2" : ""}
              description={bullet}
              header={<div className="h-1 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" />}
              key={bullet}
              title={`Signal ${index + 1}`}
            />
          ))}
        </BentoGrid>

        {children}
      </div>
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
      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-400">Runtime dependency error</p>
        <p className="mt-3 text-sm leading-7 text-slate-200">{message}</p>
        <p className="mt-4 text-sm text-slate-400">
          The UI shell is still healthy, but this page cannot fetch live data from the backend right now.
        </p>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Verify these checks</p>
        <ul className="mt-4 space-y-3 text-sm text-slate-200">
          {checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
