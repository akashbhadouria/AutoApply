import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
import { fetchFieldMappings } from "@/lib/api";

import { FieldMappingsManager } from "./field-mappings-manager";

export const dynamic = "force-dynamic";

export default async function FieldMappingsPage() {
  try {
    const mappings = await fetchFieldMappings();

    return (
      <FeaturePageShell
        badge="Self-learning layer"
        bullets={[
          "Unknown ATS labels can be stored once and reused on later runs.",
          "The browser worker already consults these mappings during analysis.",
          "Suggested mappings can coexist with manual confirmation paths.",
          "Paused sessions become materially more actionable with this persistence layer.",
        ]}
        description="This page stores the learned relationship between raw ATS labels and canonical profile keys so future browser runs can autofill more fields automatically."
        title="Persistent field mappings for universal ATS form interpretation."
      >
        <FieldMappingsManager initialMappings={mappings} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Self-learning layer"
        bullets={[
          "Field mappings are persisted server-side and consumed by the browser worker.",
          "This view now surfaces dependency issues without losing the app shell.",
          "The one-command launcher provisions Postgres and Redis with known credentials.",
          "After recovery, mappings should load as a normal empty or populated table.",
        ]}
        description="The field mappings page is implemented, but the backend data source is currently unavailable."
        title="Field mappings are temporarily unavailable."
      >
        <FeaturePageErrorState
          checks={[
            "Backend is running on port 4000.",
            "The field_mappings table exists in the database.",
            "If local Postgres auth is inconsistent, use npm run dev:stack.",
            "Workers are optional for viewing this page and only needed for producing learned mappings.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
