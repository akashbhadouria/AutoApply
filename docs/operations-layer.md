# Operations Layer

`Operations Layer` covers:

- paused application sessions
- notifications

## Problem it solves

Automation needs explicit operational state.

When ATS automation pauses because a field is missing, or when a referral timeout should notify the user, those events need durable storage.

## Data model

`application_sessions` stores:

- `job_id`
- `form_url`
- `filled_fields`
- `missing_field`
- `status`

`notifications` stores:

- `type`
- `title`
- `message`
- `channel`
- `status`
- related job or referral links
- delivery state that workers can update later

## API contract

### `GET /api/application-sessions`

Returns paused and resumable application sessions with job context.

### `POST /api/application-sessions`

Creates or updates a paused application session record.

### `GET /api/notifications`

Returns notifications ordered by creation time.

### `POST /api/notifications`

Creates a new notification event.

## UI behavior

The `/operations` page allows the user to:

- inspect paused sessions
- save or update missing-field interruptions
- inspect notifications
- create sample notifications for workflow testing
- review the event audit stream created by workers

This creates the operational substrate for browser workers, self-learning field mapping, and n8n notification delivery.
