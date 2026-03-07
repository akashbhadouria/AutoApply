# Connected Accounts

The connected accounts slice adds a first-class model for outreach-capable identities.

## What it covers

- LinkedIn, Gmail, Outlook, Telegram, and WhatsApp connection records
- connection status
- approval mode
- account identifier storage

## Endpoints

- `GET /api/me/connected-accounts`
- `POST /api/me/connected-accounts`

## UI behavior

The `/connected-accounts` page is the first step toward real outreach execution. It does not auto-send yet, but it establishes the contract that future messaging and approvals will use.
