# Job Hunter System

This repository contains a production-oriented scaffold for a personal job hunter automation platform.

The first implemented feature is the `Profile Manager`, which provides:

- a PostgreSQL schema for dynamic profile fields
- an Express API for listing, upserting, and deleting fields
- a Next.js dashboard page for editing those fields
- normalized jobs ingestion with duplicate detection and source merging
- application tracking linked to normalized jobs
- contacts and referrals tracking with reusable outreach drafts
- notifications and resumable paused application session tracking
- worker, queue, n8n, and agent scaffolding aligned with the target architecture
- backend queue producer APIs and a manual automation control plane

See [quickstart.md](/home/akash/AutoApply/quickstart.md) to run the current slice locally.
