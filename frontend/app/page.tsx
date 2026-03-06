import Link from "next/link";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { LampContainer } from "@/components/aceternity/lamp";

const routes = [
  { href: "/profile", title: "Profile", description: "Canonical profile fields, salary data, links, and identity primitives." },
  { href: "/jobs", title: "Jobs", description: "Normalized job ingestion with duplicate merging across platforms." },
  { href: "/applications", title: "Applications", description: "Stateful tracking with queue-driven application decisions." },
  { href: "/referrals", title: "Referrals", description: "Contacts, outreach drafts, and referral state tied to jobs." },
  { href: "/operations", title: "Operations", description: "Notifications, paused sessions, and event audit trail." },
  { href: "/automation", title: "Automation", description: "Queue producers and operator-triggered workflow runs." },
  { href: "/field-mappings", title: "Field Mappings", description: "Self-learning ATS label persistence for future runs." },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <BackgroundBeams />
      <div className="relative z-10 mx-auto max-w-7xl">
        <LampContainer>
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-cyan-300">Job Hunter System</p>
            <h1 className="mt-6 text-5xl font-semibold leading-tight text-white md:text-7xl">
              Frontend automation, redesigned around Aceternity-style interface primitives.
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              This control surface now uses an Aceternity-inspired shell for the platform: luminous hero sections, bento navigation, dark glass cards, and motion-led visual hierarchy across the dashboard.
            </p>
            <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Run</p>
                <p className="mt-2 text-sm text-slate-200">Use <span className="font-semibold text-white">npm run dev:stack</span> to start Docker-backed Postgres, Redis, backend, frontend, and workers.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Verify</p>
                <p className="mt-2 text-sm text-slate-200">Every page now keeps the styled shell and surfaces clear runtime dependency errors.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-300">Operate</p>
                <p className="mt-2 text-sm text-slate-200">Jobs, applications, referrals, operations, automation, and field mappings all route through the same backend contracts.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20" href="/profile">
                Open Profile
              </Link>
              <Link className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/10" href="/automation">
                Open Automation
              </Link>
            </div>
          </div>
        </LampContainer>

        <BentoGrid className="mt-8 md:auto-rows-[16rem]">
          {routes.map((route, index) => (
            <BentoGridItem
              className={index === 0 || index === 4 ? "md:col-span-2" : ""}
              description={route.description}
              header={
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                    {route.title}
                  </span>
                  <Link className="text-sm text-cyan-300" href={route.href}>
                    Open
                  </Link>
                </div>
              }
              key={route.href}
              title={route.title}
            />
          ))}
        </BentoGrid>
      </div>
    </main>
  );
}
