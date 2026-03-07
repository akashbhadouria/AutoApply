# Referrals Hub

`Referrals Hub` adds two connected capabilities:

- contact management
- referral tracking

## Problem it solves

Referral outreach needs structure:

- who to message
- for which job
- what draft was prepared
- whether the contact replied or referred

This slice keeps those records separate from job discovery and application state.

## Data model

`contacts` stores candidate referral targets.

`referrals` links a `job_id` and `contact_id` with:

- `status`
- `outreach_message`
- `connection_request_message`
- `message_sent_at`
- `replied_at`

## API contract

### `GET /api/contacts`

Returns saved contacts.

### `POST /api/contacts`

Creates a new contact record.

### `GET /api/referrals`

Returns referral records joined with job and contact context.

### `POST /api/referrals`

Creates or updates a referral record for a given job and contact pair.

### `PUT /api/referrals/:id/status`

Updates a referral status. When a referral is marked `replied` or `no_response`, the backend also queues the linked job into the application flow.

## UI behavior

The `/referrals` page allows the user to:

- add contacts
- select a normalized job and contact
- save outreach and connection request drafts
- update referral status over time
- trigger application handoff automatically when a referral becomes `replied` or `no_response`

This keeps the user in manual control of messaging while making the state machine explicit for later timeout and notification automation.

## Outreach execution foundation

Referrals can now also feed an `outreach_attempts` audit layer through:

- `GET /api/outreach-attempts`
- `GET /api/outreach-attempts/referral/:referralId`
- `POST /api/outreach-attempts`
- `PUT /api/outreach-attempts/:id/approval`
- `PUT /api/outreach-attempts/:id/status`

This is the first backend step toward approval-based sending:

- draft an outreach send attempt
- attach an optional connected account
- mark it approved or rejected
- record whether it was queued, sent, failed, or cancelled

The messaging itself is still user-controlled, but the product now has a durable execution trail for future LinkedIn/email sending flows.
