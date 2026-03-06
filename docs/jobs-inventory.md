# Jobs Inventory

`Jobs Inventory` is the next foundational slice after `Profile Manager`.

## Problem it solves

The same role can appear on multiple platforms. Storing each discovery as a separate record makes referrals, application tracking, and prioritization noisy.

This slice creates one canonical job record per:

- company
- title
- location

## Data model

`jobs` stores the canonical record.

`job_sources` stores the platforms and URLs where that role was discovered.

This allows the system to merge:

- Swiggy + Frontend Engineer + Bangalore + LinkedIn
- Swiggy + Frontend Engineer + Bangalore + Instahyre

into one job with two sources.

## API contract

### `GET /api/jobs`

Returns normalized jobs with merged `sourcePlatforms`.

### `POST /api/jobs/discover`

Upserts a discovered job using normalized `company`, `title`, and `location` as the duplicate identity.

Request body:

```json
{
  "company": "Swiggy",
  "title": "Frontend Engineer",
  "location": "Bangalore",
  "jobUrl": "https://jobs.example.com/frontend-engineer",
  "sourcePlatform": "linkedin",
  "postedDate": "2026-03-06"
}
```

## UI behavior

The `/jobs` page is a manual ingestion harness for now.

It allows the user to:

- add discovered jobs
- test duplicate merging behavior
- review merged platforms for a role

The future scanner worker can call the same backend ingestion endpoint.
