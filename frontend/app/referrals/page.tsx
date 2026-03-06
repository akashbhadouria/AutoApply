import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchContacts, fetchJobs, fetchReferrals } from "@/lib/api";

import { ReferralsManager } from "./referrals-manager";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Phase 3 foundation"
        bullets={[
          "This surface depends on contacts, referrals, and jobs loading together.",
          "Manual outreach stays user-driven, but the data layer is backend-owned.",
          "The page now stays visually intact when the API is down.",
          "Run npm run dev:stack for the supported local environment.",
        ]}
        description="The referrals hub is implemented, but its live data could not be fetched."
        title="Referrals data is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Contacts, referrals, and jobs endpoints all respond successfully.",
            "Postgres is reachable with the configured credentials.",
            "If host services conflict, switch to npm run dev:stack.",
            "After recovery, manual form submissions should work through the frontend API routes.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
