import { FeaturePageShell } from "@/components/page-shell";
import { Card } from "@/components/ui/card";
import { fetchAutomationQueues } from "@/lib/api";

import { AutomationManager } from "./automation-manager";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  try {
    const queues = await fetchAutomationQueues();

    return (
      <FeaturePageShell
        badge="Automation control plane"
        bullets={[
          "n8n workflows can call stable backend enqueue endpoints.",
          "Operators can trigger runs without touching Redis directly.",
          "Queue contracts stay fixed while worker behavior evolves underneath.",
          "This page is the manual harness for worker-runtime validation.",
        ]}
        description="This page exercises the backend enqueue APIs so queue-driven automation can be tested without waiting for n8n or external schedulers."
        title="Backend queue producers for the worker runtime."
      >
        <AutomationManager queues={queues} />
      </FeaturePageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <FeaturePageShell
        badge="Automation control plane"
        bullets={[
          "The page depends on the backend queue endpoints being reachable.",
          "It also requires BACKEND_URL to be configured in frontend/.env.local.",
          "Workers and Redis only matter after the page itself can load queue metadata.",
          "Use the health endpoint first when debugging local setup.",
        ]}
        description="Automation is implemented, but this page cannot render queue metadata until the backend is reachable from the frontend runtime."
        title="Automation control plane is temporarily unavailable."
      >
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-400">Runtime dependency error</p>
          <p className="mt-3 text-sm text-ink">{message}</p>
          <p className="mt-4 text-sm text-muted">
            Verify <code>frontend/.env.local</code> contains <code>BACKEND_URL=http://localhost:4000</code>, then start the backend and retry.
          </p>
        </Card>
      </FeaturePageShell>
    );
  }
}
