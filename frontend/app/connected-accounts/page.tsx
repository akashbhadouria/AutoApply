import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchConnectedAccounts } from "@/lib/api";

import { ConnectedAccountsManager } from "./connected-accounts-manager";

export const dynamic = "force-dynamic";

export default async function ConnectedAccountsPage() {
  try {
    const accounts = await fetchConnectedAccounts();

    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "User ko bas real provider identifiers dene chahiye, complex dropdown setup nahi.",
          "LinkedIn, Gmail, Telegram, aur WhatsApp targets yahin capture honge.",
          "At least one connection target ke bina outreach layer useful nahi hai.",
          "Save ke baad har provided identifier ko later actual connect/verify state me le jaa sakte ho.",
        ]}
        description="Use this page to capture the real delivery identifiers that AutoApply can later connect and verify for outreach and notifications."
        title="Connected account targets."
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
