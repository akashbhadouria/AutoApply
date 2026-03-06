# Applications Tracker

`Applications Tracker` builds on top of the normalized jobs inventory.

## Problem it solves

If application state is stored separately from canonical jobs, duplicate job discoveries can create multiple trackers for the same opportunity.

This slice stores one application record per normalized job.

## Data model

`applications` references `jobs.id` and enforces a unique application per job.

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

## UI behavior

The `/applications` page allows the user to:

- select a normalized job
- assign or update application status
- mark the job as applied
- review current application state in one table

Future automation workers can update the same endpoint after browser-assisted application flows finish.
