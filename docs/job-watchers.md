# Job Watchers

The AutoApply V1 watcher slice adds user-level discovery rules and a dedicated watcher queue.

## What it covers

- per-user watcher records
- source platform and provider
- polling interval
- search titles and locations
- watcher status
- manual watcher run through the automation queue
- automatic watcher scheduling inside the workers process

## Endpoints

- `GET /api/me/job-watchers`
- `GET /api/me/job-watchers/activity`
- `POST /api/me/job-watchers`
- `PUT /api/me/job-watchers/:watcherId/status`
- `GET /api/me/job-watchers/:watcherId/cursor`
- `PUT /api/me/job-watchers/:watcherId/cursor`
- `GET /api/me/job-watchers/:watcherId/discovery-events`
- `GET /api/me/job-watchers/discovery-events/recent`
- `POST /api/me/job-watchers/:watcherId/discovery-events`

## Worker behavior

The `job-feed-watcher` queue now:

- is automatically fed by a scheduler loop when watcher scheduling is enabled
- loads active watcher records
- runs discovery for their title/location rules
- loads the last saved watcher cursor before each sweep
- writes jobs with freshness, priority, apply strategy, and watcher attribution
- writes dedicated `job_discovery_events` rows for discovered and fresh jobs
- updates `job_feed_cursors` after each successful sweep so watcher state survives restarts
- emits `fresh_job_detected` for jobs inside the instant-response window
- queues `referral-engine` when same-company contacts exist and referral-first policy applies
- queues `application-queue` immediately when no referral path exists and instant apply is allowed
- records dashboard notifications for watcher sweeps

## UI behavior

The `/job-watchers` page lets the operator:

- create watcher rules
- provide a watcher-specific live feed URL for `greenhouse`, `lever`, `generic_json`, or `google_jobs`
- preview a live feed before saving the watcher
- activate or pause watchers
- run a watcher immediately
- inspect per-watcher cursor health and recent discovery counts
- inspect the latest cross-watcher discovery stream with event-type filtering

For real company-site testing, use:

- `sourcePlatform = company_site`
- `provider = greenhouse` or `lever`
- a real public feed URL such as:
  - `https://boards-api.greenhouse.io/v1/boards/<company>/jobs`
  - `https://api.lever.co/v0/postings/<company>?mode=json`

The preview panel now tells you:

- how many records the remote feed returned
- how many jobs matched your title/location/recency filters
- a short sample of matched jobs before you save the watcher

The backend now also exposes two focused operator feeds for redesigned UI work:

- watcher activity snapshots with cursor and recent discovery counts
- recent discovery stream across all current-user watchers, optionally filtered by event type

This is the bridge between the old scanner prototype and a real near-real-time discovery system.

## Scheduler behavior

When `WATCHER_SCHEDULER_ENABLED=true`, the workers process:

- polls active watchers on a short interval
- compares `last_run_at` to each watcher's `polling_interval_seconds`
- enqueues due watchers automatically with deduped job ids
- writes scheduler events for successful enqueue decisions and scheduler failures
