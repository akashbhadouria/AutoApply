# Outreach Inbox

The outreach inbox separates pending referral work from the broader referrals workspace.

## What it shows

- pending referral records
- contact and company context
- outreach message body
- connected-account aware outreach draft creation
- approval and execution audit status
- fast actions for `replied`, `referred`, and `no_response`

## Endpoints

- `GET /api/referrals/pending`
- `GET /api/me/connected-accounts`
- `GET /api/outreach-attempts`
- `POST /api/outreach-attempts`
- `PUT /api/outreach-attempts/:id/approval`
- `PUT /api/outreach-attempts/:id/status`
- `PUT /api/referrals/:id/status`

## UI behavior

The `/outreach-inbox` page is designed for approval and response handling. It now lets the operator:

- select a channel and connected account
- create a durable outreach attempt draft from a pending referral
- approve or reject that draft
- record whether it was queued, sent, or failed
- still use the existing referral status side effects to move jobs into the application path when needed
