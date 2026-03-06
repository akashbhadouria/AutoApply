# Demo Seed

Local development now includes a deterministic demo-data seed path.

## Command

Run it directly with:

```bash
npm run seed:demo
```

Or use:

```bash
npm run dev:stack
```

The dev stack applies the schema and then seeds demo data automatically before starting backend, frontend, and workers.

## What gets seeded

- profile fields
- normalized jobs and merged job sources
- applications
- contacts
- referrals
- paused ATS sessions
- notifications
- events
- field mappings

## Properties

- idempotent for the main records
- safe to rerun during local development
- designed to make the dashboard and operational pages immediately useful after startup
