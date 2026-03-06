import { Card } from "@/components/ui/card";
import { fetchAutomationQueues } from "@/lib/api";

import { AutomationManager } from "./automation-manager";

export const dynamic = "force-dynamic";

export default async function AutomationPage() {
  const queues = await fetchAutomationQueues();

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <div className="mb-8 grid gap-6 rounded-[36px] border border-border bg-panel p-8 shadow-panel lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">Automation control plane</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Backend queue producers for the worker runtime.
          </h1>
          <p className="max-w-2xl text-base text-muted">
            This page exercises the backend enqueue APIs so queue-driven automation can be tested without waiting for n8n or external schedulers.
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">What this unlocks next</p>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            <li>n8n workflows can call stable backend enqueue endpoints</li>
            <li>Workers can be integration-tested without hand-crafted Redis commands</li>
            <li>Playwright and scanner runtimes can be introduced behind fixed queue contracts</li>
            <li>Operational dashboards can trigger targeted runs safely</li>
          </ul>
        </Card>
      </div>

      <AutomationManager queues={queues} />
    </main>
  );
}
