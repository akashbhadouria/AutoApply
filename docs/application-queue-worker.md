# Application Queue Worker

`applicationQueueWorker` now performs real backend state transitions.

## Current behavior

For a queued application job, the worker:

1. checks whether the job is already applied
2. checks whether any referral for the job is already `referred`
3. checks whether referral activity is still pending
4. creates or updates the application record accordingly
5. chooses the concrete apply strategy from the job record
6. executes `api` and `http_form` jobs directly inside the worker
7. enqueues browser automation only when the strategy requires it or a lighter strategy is unsupported
8. writes events, notifications, and apply-attempt audit records describing the outcome
9. defers jobs when the hourly application rate limit has been reached

## Decision rules

- already applied: skip
- referred: skip
- pending referral exists: keep application in `pending`
- replied or no_response referrals do not block application processing
- if the hourly application cap is reached: requeue the job with a delay instead of applying immediately
- otherwise: mark as `applied` and execute the selected apply strategy

This preserves the system rule that referral success should block manual application, while unresolved referral activity can still hold the application in a waiting state.

## Strategy routing

The worker now reads `applyStrategy` from the canonical job record:

- `api`: run the direct-apply adapter
- `http_form`: run the lightweight HTTP-form adapter
- `browser`: queue Playwright automation

If a lighter strategy reports `unsupported`, the worker records an apply attempt and falls back to browser automation automatically.

Every execution path now also writes an `apply_attempts` record with:

- strategy
- provider
- status
- request payload summary
- response summary
- duration
- optional external reference

## Local browser target

For local validation, the browser fallback still sends automation to deterministic `example.com` provider-aware ATS mocks instead of a dead placeholder domain. That keeps the application queue testable with the current Playwright worker.

The original source platform is also forwarded into browser automation so the application record keeps the discovery source instead of being overwritten during ATS submission.

## Rate limiting

The worker now reads `application_rate_limit_per_hour` from persisted system settings.

When the applied-count snapshot for the last hour is already at or above that limit:

- the worker emits `application_queue.rate_limited`
- a dashboard notification is created
- the job is requeued with a calculated delay until the next slot should open
