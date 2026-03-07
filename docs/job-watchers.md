# Job Watchers

The AutoApply V1 watcher slice adds user-level discovery rules and a dedicated watcher queue.

## What it covers

- per-user watcher records
- source platform and provider
- polling interval
- search titles and locations
- watcher status
- manual watcher run through the automation queue

## Endpoints

- `GET /api/me/job-watchers`
- `POST /api/me/job-watchers`
- `PUT /api/me/job-watchers/:watcherId/status`

## Worker behavior

The `job-feed-watcher` queue now:

- loads active watcher records
- runs discovery for their title/location rules
- writes jobs with freshness, priority, apply strategy, and watcher attribution
- emits `fresh_job_detected` for jobs inside the instant-response window
- queues `referral-engine` when same-company contacts exist and referral-first policy applies
- queues `application-queue` immediately when no referral path exists and instant apply is allowed
- records dashboard notifications for watcher sweeps

## UI behavior

The `/job-watchers` page lets the operator:

- create watcher rules
- activate or pause watchers
- run a watcher immediately

This is the bridge between the old scanner prototype and a real near-real-time discovery system.
