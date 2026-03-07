# Applications Tracker

`Applications Tracker` builds on top of the normalized jobs inventory.

## Problem it solves

If application state is stored separately from canonical jobs, duplicate job discoveries can create multiple trackers for the same opportunity.

This slice stores one application record per normalized job.

## Data model

`applications` references `jobs.id` and enforces a unique application per job.

`apply_attempts` stores execution-level audit records for the 3-tier engine:

- strategy
- provider
- status
- request and response summaries
- duration
- external reference when available

Tracked fields:

- `source_platform`
- `applied`
- `applied_date`
- `status`

## API contract

### `GET /api/applications`

Returns applications joined with job context:

- company
- title
- location

### `POST /api/applications`

Creates or updates the application state for a job.

Request body:

```json
{
  "jobId": 1,
  "sourcePlatform": "linkedin",
  "applied": true,
  "appliedDate": "2026-03-06T12:00:00.000Z",
  "status": "applied"
}
```

### `GET /api/apply-attempts`

Returns recent apply-attempt audit records with optional filters:

- `status`
- `strategy`
- `provider`
- `limit`

### `GET /api/apply-attempts/job/:jobId`

Returns the execution history for one normalized job.

## UI behavior

The `/applications` page allows the user to:

- select a normalized job
- assign or update application status
- mark the job as applied
- review current application state in one table
- inspect which strategy actually ran for recent application attempts
- filter audit history by status and strategy
- focus one job and inspect its execution trail

Future automation workers can update the same endpoint after browser-assisted application flows finish.
