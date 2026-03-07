import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchPendingReferrals } from "@/lib/api";

import { OutreachInboxManager } from "./outreach-inbox-manager";

export const dynamic = "force-dynamic";

export default async function OutreachInboxPage() {
  try {
    const referrals = await fetchPendingReferrals();

    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page isolates pending outreach from the broader referrals workspace.",
          "It is designed around approval and response handling.",
          "The watcher pipeline can route fresh jobs here automatically.",
          "This is the first step toward a real outreach operations inbox.",
        ]}
        description="Review pending referral requests, mark outcomes quickly, and hand jobs into the application path when referral momentum is weak."
        title="Outreach inbox for pending referral work."
      >
        <OutreachInboxManager initialReferrals={referrals} />
      </FeaturePageShell>
    );
  } catch (error) {
    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page depends on the pending referrals endpoint.",
          "Referral records still live in the canonical referrals model.",
          "Use the referrals page to add contacts and drafts if the inbox is empty.",
          "The runtime banner above should show dependency failures.",
        ]}
        description="The outreach inbox is implemented, but pending referral data could not be loaded."
        title="Outreach inbox is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/referrals/pending returns data.",
            "There are pending referrals in the seeded or live database.",
            "Use /referrals or watcher-triggered referral jobs to create drafts.",
            "Use npm run dev:stack after pulling the latest changes.",
          ]}
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </FeaturePageShell>
    );
  }
}
