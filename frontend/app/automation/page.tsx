import { FeaturePageErrorState, FeaturePageShell } from "@/components/page-shell";
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
        <FeaturePageErrorState
          checks={[
            "BACKEND_URL resolves to the running backend instance.",
            "The backend health check returns 200 from http://localhost:4000/health.",
            "Redis and workers are only required after queue metadata loads.",
            "The one-command launcher npm run dev:stack will start the local stack against Dockerized Postgres and Redis.",
          ]}
          message={message}
        />
      </FeaturePageShell>
    );
  }
}
