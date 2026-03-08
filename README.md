# Job Hunter System

This repository contains a production-oriented scaffold for a personal job hunter automation platform.

The frontend is now standardized on an Aceternity-inspired component system and page shell direction.

The recommended local development path is now a single command:

```bash
npm run dev:stack
```

That command brings up Dockerized PostgreSQL and Redis, applies the schema, and starts backend, frontend, and workers together with consistent local credentials.
It does not seed demo data automatically.

The current implemented product slice provides:

- a stepper-based AutoApply onboarding flow with activation gating
- in-onboarding job-platform connection for LinkedIn, Naukri, Instahyre, and Hirist
- persisted current-user identity and job preferences
- persisted extended onboarding data through dynamic profile fields
- a connected-platform hub aligned with the new product model
- approval-ready outreach attempt auditing linked to referrals and connected accounts
- an outreach execution worker for approved email/Telegram/WhatsApp sends, with LinkedIn kept in manual-review mode
- job watchers for per-user discovery rules and near-real-time watcher runs
- persistent watcher cursors and discovery-event audit history for restart-safe job watching
- focused watcher activity and recent discovery APIs for operator-grade redesign work
- fresh jobs and outreach inbox operator surfaces
- a live dashboard overview with runtime status and aggregate system metrics
- dashboard summary data now also includes watcher activity and recent apply-attempt audit snapshots
- a PostgreSQL schema for dynamic profile fields
- an Express API for listing, upserting, and deleting fields
- a Next.js dashboard page for editing those fields
- normalized jobs ingestion with duplicate detection and source merging
- application tracking linked to normalized jobs
- contacts and referrals tracking with reusable outreach drafts
- dedicated notifications and settings pages backed by persistent storage
- notifications and resumable paused application session tracking
- worker, queue, n8n, and agent scaffolding aligned with the target architecture
- importable n8n workflows aligned with the current backend queue contracts
- backend queue producer APIs and a manual automation control plane
- Playwright-backed browser analysis and persistent field mapping storage
- backend-powered agent endpoints and UI flows for referral drafts and ATS field mapping suggestions
- agent-assisted job-description and notification summarization directly in the dashboard UI
- configurable live company ATS feed ingestion for the job scanner
- BullMQ queue diagnostics surfaced in the automation control plane
- queue retry/backoff policy and recent failed-job retention surfaced in the automation control plane
- resumable ATS sessions can now be re-queued directly from the operations surface
- optional live notification delivery adapters for Telegram and webhook-based email/WhatsApp channels
- referral status actions that can automatically hand jobs into the application queue
- the application queue now routes jobs through `api`, `http_form`, or `browser` execution paths and writes apply-attempt audit records
- apply-attempt audits can now be listed directly with backend filters instead of only per-job lookup
- application routing is now provider-aware through the `application_methods` registry and stored `applyProvider` metadata on jobs
- a global runtime-integration banner that shows whether the frontend can currently reach the backend
- `/health` now reports backend, PostgreSQL, and Redis dependency status instead of only a static ok response
- the automation control plane can now pause and resume BullMQ queues directly from the UI

See [quickstart.md](/home/akash/AutoApply/quickstart.md) to run the current slice locally.
