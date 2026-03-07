# n8n Workflows

The `n8n-workflows/` directory now contains importable workflow definitions aligned with the current backend and worker contracts.

## Included workflows

- `job-discovery.json`
  Runs every 15 minutes and enqueues `job-scanner`.

- `referral-timeout.json`
  Runs hourly and enqueues `referral-engine` in `timeouts` mode.

- `notification-delivery.json`
  Polls pending notifications every 5 minutes and enqueues `notifications` jobs for the worker.

- `application-monitoring.json`
  Polls the dashboard summary every 10 minutes and creates a monitoring notification when the platform is degraded or backed up.

- `resume-session-alerts.json`
  Polls paused and resumable ATS sessions every 20 minutes and creates dashboard reminders.

## Environment variable

Each workflow expects:

- `AUTOAPPLY_BACKEND_URL`

If not supplied, the workflow JSON defaults to `http://localhost:4000`.

## Import flow

1. Open n8n.
2. Import the JSON file from `n8n-workflows/`.
3. Review the HTTP Request nodes.
4. Set `AUTOAPPLY_BACKEND_URL` if your backend is not on the local default.
5. Activate the workflow.

## Notes

- The workflows are intentionally backend-driven. They do not talk to Redis directly.
- Queue names and payloads match the current Automation control plane.
- Monitoring and resume-session workflows are conservative templates and may create repeated reminders if activated without further deduplication logic.
