# Onboarding

The HirePilot V1 onboarding flow introduces a product-facing setup surface for the current user.

## What it covers

- founder/candidate identity
- resume URL and local resume path
- LinkedIn, portfolio, and GitHub links
- preferred roles and locations
- referral strategy
- instant-apply policy
- notification channels

## Endpoints

- `GET /api/me`
- `PUT /api/me`
- `GET /api/me/preferences`
- `PUT /api/me/preferences`

## UI behavior

The `/onboarding` page saves identity and job targeting together so the rest of the product has a single source of truth before watchers or applications run.
