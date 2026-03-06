# Job Hunter System

This repository contains a production-oriented scaffold for a personal job hunter automation platform.

The frontend is now standardized on an Aceternity-inspired component system and page shell direction.

The recommended local development path is now a single command:

```bash
npm run dev:stack
```

That command brings up Dockerized PostgreSQL and Redis, applies the schema, and starts backend, frontend, and workers together with consistent local credentials.
It also seeds deterministic demo data so the dashboard and operational pages are immediately usable.

The first implemented feature is the `Profile Manager`, which provides:

- a live dashboard overview with runtime status and aggregate system metrics
- a PostgreSQL schema for dynamic profile fields
- an Express API for listing, upserting, and deleting fields
- a Next.js dashboard page for editing those fields
- normalized jobs ingestion with duplicate detection and source merging
- application tracking linked to normalized jobs
- contacts and referrals tracking with reusable outreach drafts
- dedicated notifications and settings pages backed by persistent storage
- notifications and resumable paused application session tracking
- worker, queue, n8n, and agent scaffolding aligned with the target architecture
- backend queue producer APIs and a manual automation control plane
- Playwright-backed browser analysis and persistent field mapping storage

See [quickstart.md](/home/akash/AutoApply/quickstart.md) to run the current slice locally.
