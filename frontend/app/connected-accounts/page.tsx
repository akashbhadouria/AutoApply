import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchConnectedAccounts } from "@/lib/api";

import { ConnectedAccountsManager } from "./connected-accounts-manager";

export const dynamic = "force-dynamic";

export default async function ConnectedAccountsPage() {
  try {
    const accounts = await fetchConnectedAccounts();

    return (
      <FeaturePageShell
        badge="HirePilot V1"
        bullets={[
          "Account connection is a hard requirement for real outreach execution.",
          "Approval mode is explicit instead of hidden in worker logic.",
          "This is the first product surface for startup-grade identity orchestration.",
          "LinkedIn and email can now be represented as operator-managed connections.",
        ]}
        description="Use this page to model how outreach-capable accounts connect to HirePilot before any real send path is introduced."
        title="Connected accounts and approval policy."
      >
        <ConnectedAccountsManager initialAccounts={accounts} />
      </FeaturePageShell>
    );
  } catch (error) {
    return (
      <FeaturePageShell
        badge="HirePilot V1"
        bullets={[
          "This page depends on the new connected accounts entity.",
          "The surface is intentionally separate from generic settings.",
          "Use the dev stack after schema changes.",
          "The runtime banner above should show backend dependency status.",
        ]}
        description="The connected accounts page is implemented, but live account data could not be loaded."
        title="Connected accounts are temporarily unavailable."
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
