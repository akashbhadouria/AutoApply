import { Card } from "@/components/ui/card";
import { fetchFieldMappings } from "@/lib/api";

import { FieldMappingsManager } from "./field-mappings-manager";

export const dynamic = "force-dynamic";

export default async function FieldMappingsPage() {
  const mappings = await fetchFieldMappings();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Self-learning layer</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Persistent field mappings for universal ATS form interpretation.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This page stores the learned relationship between raw ATS labels and canonical profile keys so future browser runs can autofill more fields automatically.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>Unknown ATS fields can be persisted after one manual resolution</li>
            <li>Browser automation can pause on genuinely new labels instead of every nonstandard form</li>
            <li>AI field suggestions can write suggested mappings without changing the ATS engine contract</li>
            <li>Resume sessions become more useful because the missing label is linked to a persistent mapping model</li>
          </ul>
        </Card>
      </div>

      <FieldMappingsManager initialMappings={mappings} />
    </main>
  );
}
