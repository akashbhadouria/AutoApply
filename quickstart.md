# Quickstart

This repository currently implements seven foundational slices of the larger job-hunting automation system:

- `Profile Manager`
- `Jobs Inventory`
- `Applications Tracker`
- `Contacts + Referrals`
- `Operations Layer`
- `Automation Control Plane`
- `ATS Self-Learning Layer`

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

To manually run the referral-timeout sweep from the Automation page, enqueue `referral-engine` with:

```json
{
  "mode": "timeouts",
  "olderThanHours": 24
}
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

## Implemented endpoints

- `GET /health`
- `GET /api/dashboard/summary`
- `GET /api/profile-fields`
- `PUT /api/profile-fields/:key`
- `DELETE /api/profile-fields/:key`
- `GET /api/jobs`
- `POST /api/jobs/discover`
- `POST /api/jobs/discover/batch`
- `GET /api/applications`
- `GET /api/applications/job/:jobId`
- `POST /api/applications`
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/referrals`
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
- `GET /api/automation/queues`
- `POST /api/automation/enqueue`

## Implemented docs

- [docs/profile-manager.md](/home/akash/AutoApply/docs/profile-manager.md)
- [docs/dashboard.md](/home/akash/AutoApply/docs/dashboard.md)
- [docs/demo-seed.md](/home/akash/AutoApply/docs/demo-seed.md)
- [docs/jobs-inventory.md](/home/akash/AutoApply/docs/jobs-inventory.md)
- [docs/applications-tracker.md](/home/akash/AutoApply/docs/applications-tracker.md)
- [docs/referrals-hub.md](/home/akash/AutoApply/docs/referrals-hub.md)
- [docs/notifications.md](/home/akash/AutoApply/docs/notifications.md)
- [docs/operations-layer.md](/home/akash/AutoApply/docs/operations-layer.md)
- [docs/worker-architecture.md](/home/akash/AutoApply/docs/worker-architecture.md)
- [docs/automation-control-plane.md](/home/akash/AutoApply/docs/automation-control-plane.md)
- [docs/job-scanner-worker.md](/home/akash/AutoApply/docs/job-scanner-worker.md)
- [docs/application-queue-worker.md](/home/akash/AutoApply/docs/application-queue-worker.md)
- [docs/referral-engine-worker.md](/home/akash/AutoApply/docs/referral-engine-worker.md)
- [docs/field-mappings.md](/home/akash/AutoApply/docs/field-mappings.md)
- [docs/browser-worker.md](/home/akash/AutoApply/docs/browser-worker.md)
- [docs/settings.md](/home/akash/AutoApply/docs/settings.md)
- [database/schema.sql](/home/akash/AutoApply/database/schema.sql)
