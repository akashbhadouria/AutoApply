import { Card } from "@/components/ui/card";
import { fetchContacts, fetchJobs, fetchReferrals } from "@/lib/api";

import { ReferralsManager } from "./referrals-manager";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const [contacts, referrals, jobs] = await Promise.all([fetchContacts(), fetchReferrals(), fetchJobs()]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Phase 3 foundation</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Contacts and referrals organized around canonical jobs.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This creates a central place to track outreach targets, save message drafts, and monitor referral state without mixing that data into raw job discovery.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>Automated draft generation can write into stable referral records</li>
            <li>Timeout rules can move no-response referrals into the application queue</li>
            <li>Notification workers can target meaningful referral events</li>
            <li>Manual outreach stays separated from browser automation</li>
          </ul>
        </Card>
      </div>

      <ReferralsManager initialContacts={contacts} initialReferrals={referrals} jobs={jobs} />
    </main>
  );
}
