# Automation Control Plane

The automation control plane exposes backend APIs that enqueue work into BullMQ queues.

## Purpose

This creates a stable integration boundary for:

- n8n workflows
- manual operator-triggered runs
- future cron or agent-driven orchestration

## Endpoints

### `GET /api/automation/queues`

Returns the registered queue names.

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

## UI behavior

The `/automation` page is a manual control harness that:

- lists queue names
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
