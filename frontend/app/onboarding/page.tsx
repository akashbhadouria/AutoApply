import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchCurrentUser, fetchCurrentUserPreferences } from "@/lib/api";

import { OnboardingManager } from "./onboarding-manager";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  try {
    const [user, preferences] = await Promise.all([fetchCurrentUser(), fetchCurrentUserPreferences()]);

    return (
      <FeaturePageShell
        badge="HirePilot V1"
        bullets={[
          "This is the first user-facing startup-grade onboarding flow in the repo.",
          "Identity, preferences, and automation policy are now configured together.",
          "The product can evolve to multi-tenant auth without discarding this surface.",
          "Fresh-job and referral policy now have a home in the product UI.",
        ]}
        description="Use this page to configure founder-level candidate identity, resume links, targeting preferences, and instant-apply rules before watchers and applications start running."
        title="Onboard the user before continuous job hunting begins."
      >
        <OnboardingManager initialPreferences={preferences} initialUser={user} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="HirePilot V1"
        bullets={[
          "This page depends on the new current-user and preferences endpoints.",
          "It should remain usable even if the rest of the product is only partially migrated.",
          "Use the local dev stack if your backend/runtime is inconsistent.",
          "The runtime banner above should show where the dependency failure is happening.",
        ]}
        description="The onboarding flow is implemented, but the backend user state could not be loaded."
        title="Onboarding is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/me returns a current user payload.",
            "GET /api/me/preferences returns user targeting preferences.",
            "database/schema.sql has been applied after the HirePilot V1 schema update.",
            "Use npm run dev:stack after schema changes so the Docker DB is current.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
