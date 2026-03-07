# Dashboard

The root route `/` is now the live dashboard for the platform rather than a static landing page.

## What it shows

- system health for backend, PostgreSQL, and Redis
- core metrics for jobs, applications, referrals, paused ATS sessions, notifications, and field mappings
- application status breakdown
- referral status breakdown
- recent events
- recent normalized jobs
- latest scanner diagnostics with live, fallback, and error visibility per feed
- direct navigation into every operational page

## Backend contract

The dashboard is powered by:

- `GET /api/dashboard/summary`

That endpoint aggregates:

- entity counts from the main persistence tables
- runtime readiness checks
- recent jobs
- recent events
- latest job scanner telemetry parsed from the most recent `job_scanner.run_requested` event
- application and referral status breakdowns

## Local development

Use:

```bash
npm run dev:stack
```

That launcher starts Dockerized PostgreSQL and Redis, applies the schema, and then starts backend, frontend, and workers against the same deterministic local runtime.
