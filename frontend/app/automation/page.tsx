import { FeaturePageShell } from "@/components/page-shell";
import { fetchAutomationQueues } from "@/lib/api";

import { AutomationManager } from "./automation-manager";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
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
}
