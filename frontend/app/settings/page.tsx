import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchSystemSettings } from "@/lib/api";

import { SettingsManager } from "./settings-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  try {
    const settings = await fetchSystemSettings();

    return (
      <FeaturePageShell
        badge="Settings"
        bullets={[
          "System settings now persist as first-class records instead of hidden env assumptions.",
          "Notification and automation policy can be configured without code edits.",
          "This page is the future anchor for channel credentials and rate limits.",
          "Stored settings complement env vars rather than replacing infrastructure secrets.",
        ]}
        description="This dedicated settings surface stores operator-level runtime configuration for notifications, automation defaults, and future integrations."
        title="Persisted system settings for the automation control plane."
      >
        <SettingsManager initialSettings={settings} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Settings"
        bullets={[
          "Settings are now backed by the database rather than temporary UI-only state.",
          "The page keeps the shell intact even when the settings dataset cannot load.",
          "Use the deterministic local stack to avoid host-environment drift.",
          "After recovery, the page should render persisted automation and notification controls.",
        ]}
        description="The settings surface could not fetch its live data."
        title="Settings are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend responds on port 4000.",
            "The system_settings table exists in the database.",
            "The schema has been re-applied after the settings slice landed.",
            "Use npm run dev:stack for the supported local runtime.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
