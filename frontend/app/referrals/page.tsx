import { FeaturePageShell } from "@/components/page-shell";
import { fetchContacts, fetchJobs, fetchReferrals } from "@/lib/api";

import { ReferralsManager } from "./referrals-manager";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  const [contacts, referrals, jobs] = await Promise.all([fetchContacts(), fetchReferrals(), fetchJobs()]);

  return (
    <FeaturePageShell
      badge="Phase 3 foundation"
      bullets={[
        "Draft outreach stays linked to specific job and contact pairs.",
        "Timeout logic can promote no-response referrals into the apply path.",
        "The worker layer already creates initial referral drafts here.",
        "Manual sending stays separate from browser automation by design.",
      ]}
      description="This creates a central place to track outreach targets, save message drafts, and monitor referral state without mixing that data into raw job discovery."
      title="Contacts and referrals organized around canonical jobs."
    >
      <ReferralsManager initialContacts={contacts} initialReferrals={referrals} jobs={jobs} />
    </FeaturePageShell>
  );
}
