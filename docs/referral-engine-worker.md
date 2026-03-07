# Referral Engine Worker

`referralEngineWorker` now creates real referral draft records and can process 24-hour referral timeouts.

## Current behavior

For a queued referral job in `drafts` mode, the worker:

1. fetches existing referrals for the target job
2. fetches contacts and profile fields from the backend
3. chooses contacts that are not already linked to that job
4. creates up to three `pending` referral records with generated drafts
5. writes events and notifications describing the result

For a queued referral job in `timeouts` mode, the worker:

1. fetches pending referrals older than the configured threshold
2. marks them as `no_response`
3. enqueues the affected jobs into the application queue
4. writes timeout-sweep events and notifications

This implements the spec rule that pending referrals with no reply after the timeout window should transition to `no_response` and move into the application path automatically.

The same application-handoff rule is now also enforced when an operator manually changes a referral to `replied` or `no_response` from the referrals UI.

## Timeout trigger

Use this payload on the Automation page to run the timeout sweep manually:

```json
{
  "mode": "timeouts",
  "olderThanHours": 24
}
```

## Draft generation

The current draft logic is deterministic and uses:

- contact first name
- company
- a fixed role-oriented message template
- optional `resume_link` or `resume` profile field
- optional `name` profile field

This worker still creates deterministic draft records, but the referrals UI now also exposes a backend agent endpoint for generating OpenClaw-compatible outreach content without changing the referral persistence contract.
