import { Card } from "@/components/ui/card";
import { fetchProfileFields } from "@/lib/api";

import { ProfileManager } from "./profile-manager";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const fields = await fetchProfileFields();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Phase 1</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Dynamic profile fields for a long-lived job application automation stack.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This page is the canonical place to manage reusable values like resume links, notice period, expected salary, and contact information. Later workers can consume the same dataset without duplicating state.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>ATS form autofill using canonical field keys</li>
            <li>Self-learning storage for newly discovered fields</li>
            <li>Referral message generation with resume and portfolio data</li>
            <li>Safer resume sessions because missing data is explicit</li>
          </ul>
        </Card>
      </div>

      <ProfileManager initialFields={fields} />
    </main>
  );
}
