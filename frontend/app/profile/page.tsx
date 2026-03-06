import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchProfileFields } from "@/lib/api";

import { ProfileManager } from "./profile-manager";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  try {
    const fields = await fetchProfileFields();

    return (
      <FeaturePageShell
        badge="Phase 1"
        bullets={[
          "ATS form autofill uses canonical profile keys instead of page-specific state.",
          "Referral and application workers both read from the same identity surface.",
          "New salary or notice-period inputs can be learned without schema churn.",
          "This is the baseline contract for every later automation slice.",
        ]}
        description="This page is the canonical place to manage reusable values like resume links, notice period, expected salary, and contact information. Later workers can consume the same dataset without duplicating state."
        title="Dynamic profile fields for a long-lived automation stack."
      >
        <ProfileManager initialFields={fields} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Phase 1"
        bullets={[
          "Profile data is the first dependency every other slice reads from.",
          "If this page cannot load, downstream ATS and referral flows will also be incomplete.",
          "The Docker-backed dev stack removes host-specific Postgres auth issues.",
          "Run npm run dev:stack to bring up the supported local environment.",
        ]}
        description="The profile manager is implemented, but live data could not be fetched from the backend."
        title="Profile data is temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend responds at http://localhost:4000/health.",
            "The local Postgres instance is reachable with the expected credentials.",
            "If host database auth is inconsistent, use npm run dev:stack.",
            "frontend/.env.local can omit BACKEND_URL because the app defaults to http://localhost:4000 now.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
