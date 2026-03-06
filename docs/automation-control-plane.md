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

