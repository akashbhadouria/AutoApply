import Link from "next/link";
import type { ReactNode } from "react";

import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { LampContainer } from "@/components/aceternity/lamp";

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

