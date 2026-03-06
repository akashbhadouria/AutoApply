import { FeaturePageShell } from "@/components/page-shell";
import { fetchFieldMappings } from "@/lib/api";

import { FieldMappingsManager } from "./field-mappings-manager";

export const dynamic = "force-dynamic";

export default async function FieldMappingsPage() {
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
}
