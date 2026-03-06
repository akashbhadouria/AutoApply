import { FeaturePageShell } from "@/components/page-shell";
import { fetchProfileFields } from "@/lib/api";

import { ProfileManager } from "./profile-manager";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
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
}
