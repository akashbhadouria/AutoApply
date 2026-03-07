# Quickstart

This repository currently implements eight foundational slices of the larger job-hunting automation system:

- `Profile Manager`
- `Jobs Inventory`
- `Applications Tracker`
- `Contacts + Referrals`
- `Operations Layer`
- `Automation Control Plane`
- `ATS Self-Learning Layer`
- `OpenClaw-Compatible Agent Layer`
- `AutoApply V1 Onboarding + Watchers`

## Prerequisites

- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Recommended local startup

Install dependencies once:

```bash
npm install
npx playwright install chromium
```

Then run the full local stack:

```bash
npm run dev:stack
```

That single command will:

- start Dockerized PostgreSQL on `localhost:55432`
- start Dockerized Redis on `localhost:56379`
- apply `database/schema.sql`
- seed deterministic demo data
- start backend on `http://localhost:4000`
- start frontend on `http://localhost:3000`
- start workers against the same local dependencies

Open:

- `http://localhost:3000/onboarding`
- `http://localhost:3000/connected-accounts`
- `http://localhost:3000/job-watchers`
- `http://localhost:3000/fresh-jobs`
- `http://localhost:3000/outreach-inbox`
- `http://localhost:3000/profile`
- `http://localhost:3000/jobs`
- `http://localhost:3000/applications`
- `http://localhost:3000/referrals`
- `http://localhost:3000/notifications`
- `http://localhost:3000/operations`
- `http://localhost:3000/automation`
- `http://localhost:3000/field-mappings`
- `http://localhost:3000/settings`

If you want to reseed demo data manually without restarting the stack:

```bash
npm run seed:demo
```

To verify the stack end to end:

```bash
npm run doctor
```

If the frontend starts behaving strangely after a redesign or runtime crash, restart only the frontend with a clean Next cache:

```bash
npm run dev:frontend
```

Importable n8n workflow templates are available in [n8n-workflows](/home/akash/AutoApply/n8n-workflows) and documented in [docs/n8n-workflows.md](/home/akash/AutoApply/docs/n8n-workflows.md).

To manually run the referral-timeout sweep from the Automation page, enqueue `referral-engine` with:

```json
{
  "mode": "timeouts",
  "olderThanHours": 24
}
```

To manually process a notification delivery from the Automation page, enqueue `notifications` with a real notification ID:

```json
{
  "notificationId": 17
}
```

The notification worker now respects settings like `email_enabled`, `telegram_enabled`, and `whatsapp_enabled`.

The referrals and field-mappings pages now include backend-powered agent actions:

- `Generate agent draft` on `/referrals`
- `Suggest mapping` on `/field-mappings`
- `Summarize job description` on `/jobs`
- `Summarize notification` on `/notifications`

The job scanner can now consume live company ATS feeds if the workers environment defines `JOB_SOURCE_FEEDS_JSON`. Without that configuration, it falls back to deterministic discovery data so local development stays stable.
The new AutoApply V1 watcher surface stores per-user discovery rules and can enqueue the `job-feed-watcher` queue directly.
Fresh watcher-discovered jobs now trigger downstream work automatically: referral runs when company contacts exist, or immediate application queue handoff when no referral path exists.
Watcher sweeps now also persist `job_feed_cursors` and `job_discovery_events`, so discovery state survives worker restarts and recent watcher activity can be audited.

The `/automation` page now also shows live queue backlog and worker snapshots from BullMQ, including waiting, active, delayed, failed, connected-worker counts, retry policy, and recent retained failed jobs.
It now also supports direct queue `Pause` and `Resume` controls for operator testing and incident handling.

The `/operations` page can now re-queue paused ATS sessions directly back into `browser-automation` through a `Resume` action.

The notification worker can now perform optional live delivery for:

- Telegram via `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
- email via `EMAIL_WEBHOOK_URL`
- WhatsApp via `WHATSAPP_WEBHOOK_URL`

The `/referrals` page now supports direct status actions. Marking a referral as `replied` or `no_response` will automatically queue that job into `application-queue`.

The application queue now executes the 3-tier apply engine for jobs that are ready:

- `api` jobs use the direct-apply adapter
- `http_form` jobs use the lightweight HTTP-form adapter
- `browser` jobs go to Playwright
- unsupported direct/http jobs automatically fall back to browser and record an apply attempt audit trail

Provider capabilities are now stored in `application_methods`, and jobs also persist `applyProvider` so strategy selection can be provider-aware instead of source-only.

To inspect the current applied-application count in the active rate window:

```bash
curl http://localhost:4000/api/applications/rate-window
```

## Manual startup

If you do not want to use Docker, you can still use host services by creating:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp workers/.env.example workers/.env
```

Then ensure your host PostgreSQL and Redis credentials actually match those files before running:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:workers
```

If host database auth is inconsistent, pages now remain styled and show explicit runtime dependency errors instead of dropping into raw error screens.
The frontend now also shows a global runtime banner so backend connectivity problems are visible immediately on every major page.
`GET /health` now returns real dependency status for backend, PostgreSQL, and Redis, and uses HTTP `503` when the stack is degraded.

## Implemented endpoints

- `GET /health`
- `GET /api/dashboard/summary`
- `GET /api/me`
- `PUT /api/me`
- `GET /api/me/preferences`
- `PUT /api/me/preferences`
- `GET /api/me/connected-accounts`
- `POST /api/me/connected-accounts`
- `GET /api/me/job-watchers`
- `POST /api/me/job-watchers`
- `PUT /api/me/job-watchers/:watcherId/status`
- `GET /api/me/job-watchers/:watcherId/cursor`
- `PUT /api/me/job-watchers/:watcherId/cursor`
- `GET /api/me/job-watchers/:watcherId/discovery-events`
- `POST /api/me/job-watchers/:watcherId/discovery-events`
- `GET /api/profile-fields`
- `PUT /api/profile-fields/:key`
- `DELETE /api/profile-fields/:key`
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `GET /api/jobs/fresh`
- `POST /api/jobs/discover`
- `POST /api/jobs/discover/batch`
- `GET /api/applications`
- `GET /api/application-methods`
- `GET /api/applications/rate-window`
- `GET /api/applications/job/:jobId`
- `POST /api/applications`
- `GET /api/apply-attempts/job/:jobId`
- `POST /api/apply-attempts`
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/referrals`
- `GET /api/referrals/pending`
- `GET /api/referrals/timeouts`
- `GET /api/referrals/job/:jobId`
- `POST /api/referrals`
- `PUT /api/referrals/:id/status`
- `GET /api/application-sessions`
- `POST /api/application-sessions`
- `GET /api/notifications`
- `POST /api/notifications`
- `PUT /api/notifications/:id/status`
- `GET /api/settings`
- `PUT /api/settings/:key`
- `DELETE /api/settings/:key`
- `GET /api/events`
- `POST /api/events`
- `GET /api/field-mappings`
- `POST /api/field-mappings`
- `POST /api/agents/referral-draft`
- `POST /api/agents/field-mapping-suggestion`
- `POST /api/agents/job-summary`
- `POST /api/agents/notification-summary`
- `GET /api/automation/queues`
- `POST /api/automation/enqueue`
- `POST /api/automation/queues/:queueName/pause`
- `POST /api/automation/queues/:queueName/resume`

## Implemented docs

- [docs/profile-manager.md](/home/akash/AutoApply/docs/profile-manager.md)
- [docs/onboarding.md](/home/akash/AutoApply/docs/onboarding.md)
- [docs/connected-accounts.md](/home/akash/AutoApply/docs/connected-accounts.md)
- [docs/job-watchers.md](/home/akash/AutoApply/docs/job-watchers.md)
- [docs/fresh-jobs.md](/home/akash/AutoApply/docs/fresh-jobs.md)
- [docs/outreach-inbox.md](/home/akash/AutoApply/docs/outreach-inbox.md)
- [docs/dashboard.md](/home/akash/AutoApply/docs/dashboard.md)
- [docs/demo-seed.md](/home/akash/AutoApply/docs/demo-seed.md)
- [docs/jobs-inventory.md](/home/akash/AutoApply/docs/jobs-inventory.md)
- [docs/applications-tracker.md](/home/akash/AutoApply/docs/applications-tracker.md)
- [docs/referrals-hub.md](/home/akash/AutoApply/docs/referrals-hub.md)
- [docs/notifications.md](/home/akash/AutoApply/docs/notifications.md)
- [docs/n8n-workflows.md](/home/akash/AutoApply/docs/n8n-workflows.md)
- [docs/operations-layer.md](/home/akash/AutoApply/docs/operations-layer.md)
- [docs/worker-architecture.md](/home/akash/AutoApply/docs/worker-architecture.md)
- [docs/automation-control-plane.md](/home/akash/AutoApply/docs/automation-control-plane.md)
- [docs/job-scanner-worker.md](/home/akash/AutoApply/docs/job-scanner-worker.md)
- [docs/application-queue-worker.md](/home/akash/AutoApply/docs/application-queue-worker.md)
- [docs/referral-engine-worker.md](/home/akash/AutoApply/docs/referral-engine-worker.md)
- [docs/field-mappings.md](/home/akash/AutoApply/docs/field-mappings.md)
- [docs/browser-worker.md](/home/akash/AutoApply/docs/browser-worker.md)
- [docs/settings.md](/home/akash/AutoApply/docs/settings.md)
- [docs/agents.md](/home/akash/AutoApply/docs/agents.md)
- [database/schema.sql](/home/akash/AutoApply/database/schema.sql)
