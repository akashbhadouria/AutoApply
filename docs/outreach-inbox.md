# Outreach Inbox

The outreach inbox separates pending referral work from the broader referrals workspace.

## What it shows

- pending referral records
- contact and company context
- outreach message body
- fast actions for `replied`, `referred`, and `no_response`

## Endpoints

- `GET /api/referrals/pending`
- `PUT /api/referrals/:id/status`

## UI behavior

The `/outreach-inbox` page is designed for approval and response handling. It keeps active outreach decisions in one place and uses the existing referral status side effects to move jobs into the application path when needed.
