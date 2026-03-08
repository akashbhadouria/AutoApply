import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchConnectedAccounts } from "@/lib/api";

import { ConnectedAccountsManager } from "./connected-accounts-manager";

export const dynamic = "force-dynamic";

export default async function ConnectedAccountsPage() {
  try {
    const accounts = await fetchConnectedAccounts();

    return (
      <FeaturePageShell
        badge="Platform Hub"
        bullets={[
          "This page now tracks AutoApply job-platform connections instead of generic outreach targets.",
          "LinkedIn, Naukri, Instahyre, and Hirist can be reviewed or refreshed here after onboarding.",
          "At least one connected platform is still required for automation activation.",
          "Platform operations remain backend-managed even after a connection is established.",
        ]}
        description="Review or refresh the job-platform accounts AutoApply will use for discovery and application flows."
        title="Connected job platforms."
      >
        <ConnectedAccountsManager initialAccounts={accounts} />
      </FeaturePageShell>
    );
  } catch (error) {
    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page depends on the connected accounts APIs.",
          "The surface is intentionally separate from generic settings.",
          "Use the dev stack after schema changes.",
          "The runtime banner above should show backend dependency status.",
        ]}
        description="The connected accounts page is implemented, but live account data could not be loaded."
        title="Connected account targets are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/me/connected-accounts is reachable.",
            "database/schema.sql has been re-applied.",
            "The frontend runtime can reach the backend.",
            "Use npm run dev:stack after pulling the latest changes.",
          ]}
          message={error instanceof Error ? error.message : "Unknown error"}
        />
      </FeaturePageShell>
    );
  }
}
