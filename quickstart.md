# Quickstart

This repository currently implements six foundational slices of the larger job-hunting automation system:

- `Profile Manager`
- `Jobs Inventory`
- `Applications Tracker`
- `Contacts + Referrals`
- `Operations Layer`
- `Automation Control Plane`

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

## 1. Create the database

Create a PostgreSQL database named `job_hunter`.

Run the schema:

```bash
psql "$DATABASE_URL" -f database/schema.sql
```

## 2. Configure environment variables

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Required values:

- `DATABASE_URL`
- `PORT`
- `FRONTEND_ORIGIN`
- `BACKEND_URL`

## 3. Install dependencies

```bash
npm install
```

## 4. Run the backend

```bash
npm run dev:backend
```

The API will start on `http://localhost:4000`.

## 5. Run the frontend

```bash
npm run dev:frontend
```

Open `http://localhost:3000/profile`.

Open `http://localhost:3000/jobs`.

Open `http://localhost:3000/applications`.

Open `http://localhost:3000/referrals`.

Open `http://localhost:3000/operations`.

Open `http://localhost:3000/automation`.

## 6. Run worker scaffolds

```bash
cp workers/.env.example workers/.env
npm run dev:workers
```

The worker runtime expects Redis on `REDIS_URL`.

## Implemented endpoints

- `GET /health`
- `GET /api/profile-fields`
- `PUT /api/profile-fields/:key`
- `DELETE /api/profile-fields/:key`
- `GET /api/jobs`
- `POST /api/jobs/discover`
- `GET /api/applications`
- `POST /api/applications`
- `GET /api/contacts`
- `POST /api/contacts`
- `GET /api/referrals`
- `POST /api/referrals`
- `GET /api/application-sessions`
- `POST /api/application-sessions`
- `GET /api/notifications`
- `POST /api/notifications`
- `GET /api/automation/queues`
- `POST /api/automation/enqueue`

## Implemented docs

- [docs/profile-manager.md](/home/akash/AutoApply/docs/profile-manager.md)
- [docs/jobs-inventory.md](/home/akash/AutoApply/docs/jobs-inventory.md)
- [docs/applications-tracker.md](/home/akash/AutoApply/docs/applications-tracker.md)
- [docs/referrals-hub.md](/home/akash/AutoApply/docs/referrals-hub.md)
- [docs/operations-layer.md](/home/akash/AutoApply/docs/operations-layer.md)
- [docs/worker-architecture.md](/home/akash/AutoApply/docs/worker-architecture.md)
- [docs/automation-control-plane.md](/home/akash/AutoApply/docs/automation-control-plane.md)
- [database/schema.sql](/home/akash/AutoApply/database/schema.sql)
