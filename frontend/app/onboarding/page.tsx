import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchConnectedAccounts, fetchCurrentUser, fetchCurrentUserPreferences, fetchProfileFields } from "@/lib/api";

import { OnboardingManager } from "./onboarding-manager";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  try {
    const [user, preferences, connectedAccounts, profileFields] = await Promise.all([
      fetchCurrentUser(),
      fetchCurrentUserPreferences(),
      fetchConnectedAccounts(),
      fetchProfileFields(),
    ]);

    return (
      <FeaturePageShell
        badge="AutoApply Onboarding"
        bullets={[
          "Stepper flow now owns candidate setup, job preferences, and activation gating.",
          "Resume upload, rich profile capture, and platform connection now sit in one flow.",
          "Automation stays blocked until at least one supported job platform is connected.",
          "This surface is the product entry point for the final AutoApply direction.",
        ]}
        description="Complete your candidate profile, job targeting, and platform connections here. Once activated, the backend policy engine takes over."
        title="Set up AutoApply once, then let the system run in the background."
      >
        <OnboardingManager
          initialConnectedAccounts={connectedAccounts}
          initialPreferences={preferences}
          initialProfileFields={profileFields}
          initialUser={user}
        />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="AutoApply V1"
        bullets={[
          "This page depends on current-user, profile-fields, preferences, and connected-accounts APIs.",
          "This onboarding flow now centralizes the activation gate for AutoApply.",
          "Use the local dev stack if your backend/runtime is inconsistent.",
          "The runtime banner above should show where the dependency failure is happening.",
        ]}
        description="The onboarding flow is implemented, but the required user state could not be loaded."
        title="Onboarding is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "GET /api/me returns a current user payload.",
            "GET /api/me/preferences returns user targeting preferences.",
            "GET /api/profile-fields returns persisted profile-field state.",
            "GET /api/me/connected-accounts returns connected platform state.",
            "database/schema.sql has been applied after the AutoApply V1 schema update.",
            "Use npm run dev:stack after schema changes so the Docker DB is current.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
