# Onboarding

The AutoApply V1 onboarding flow introduces a product-facing setup surface for the current user.

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

The `/onboarding` page now behaves like a two-step wizard:

- Step 1 captures candidate identity, contact targets, and resume data
- Step 2 captures job preferences and automation policy
- Arrow controls let the user move back and next between steps
- Final save automatically redirects the user to `/connected-accounts`

This keeps setup linear instead of showing the entire product configuration in one long screen.
