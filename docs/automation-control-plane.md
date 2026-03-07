# Automation Control Plane

The automation control plane exposes backend APIs that enqueue work into BullMQ queues.

## Purpose

This creates a stable integration boundary for:

- n8n workflows
- manual operator-triggered runs
- future cron or agent-driven orchestration

## Endpoints

### `GET /api/automation/queues`

Returns the registered queue names plus live BullMQ stats:

- waiting
- active
- completed
- failed
- delayed
- paused
- prioritized
- waiting children
- connected worker count
- pause state
- retry policy
- recent retained failed jobs

### `POST /api/automation/enqueue`

Enqueues a typed payload into one of the supported queues.

Example body:

```json
{
  "queueName": "job-scanner",
  "payload": {
    "searchTitles": ["Frontend Engineer", "React Developer"],
    "locations": ["Bangalore", "Remote India"],
    "recencyDays": 7
  }
}
```

### `POST /api/automation/queues/:queueName/pause`

Pauses the selected BullMQ queue so new jobs stop being claimed by workers.

### `POST /api/automation/queues/:queueName/resume`

Resumes a previously paused BullMQ queue.

## UI behavior

The `/automation` page is a manual control harness that:

- lists queue names
- shows queue health and backlog snapshots
- shows queue retry/backoff policy
- shows recent failed jobs retained in BullMQ
- allows operators to pause and resume queues directly
- allows custom JSON payloads
- confirms the enqueued queue and job id

This is the first operational bridge between the dashboard and the worker runtime.

The `job-scanner` queue now performs real backend ingestion through the batch discovery endpoint.

## n8n alignment

The following importable workflow templates now exist under [n8n-workflows](/home/akash/AutoApply/n8n-workflows):

- `job-discovery.json`
- `referral-timeout.json`
- `notification-delivery.json`
- `application-monitoring.json`
- `resume-session-alerts.json`

These workflows call the same backend enqueue APIs used by the `/automation` page.
