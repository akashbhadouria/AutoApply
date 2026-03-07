# Connected Accounts

The connected accounts slice adds a first-class model for outreach-capable identities.

## What it covers

- simple provider-specific identifiers for LinkedIn, Gmail, Telegram, and WhatsApp
- at least one required identifier before the user can proceed with connection setup
- backend connection records created from whatever identifiers the user actually provides
- an audit-friendly account link for future outreach attempts

## Endpoints

- `GET /api/me/connected-accounts`
- `POST /api/me/connected-accounts`

## UI behavior

The `/connected-accounts` page now behaves like a practical startup onboarding surface instead of a backend-operator form.

The user can provide:

- LinkedIn profile URL or public ID
- Gmail address
- Telegram username / number / chat ID
- WhatsApp number

If the user leaves all of them empty, the page shows a validation error and does not save.

For every non-empty identifier, AutoApply creates one connected-account record with:

- `connectionStatus = pending`
- `approvalMode = manual_approval`

The backend now also supports outreach attempts that can optionally point at one connected account, so approval and send flows can be audited before real auto-send is enabled.

Current runtime behavior:

- email, Telegram, and WhatsApp attempts can flow into the new outreach execution worker
- LinkedIn attempts remain intentionally manual-only and are queued for operator review instead of auto-sending
