# Application Queue Worker

`applicationQueueWorker` now performs real backend state transitions.

## Current behavior

For a queued application job, the worker:

1. checks whether the job is already applied
2. checks whether any referral for the job is already `referred`
3. checks whether referral activity is still pending
4. creates or updates the application record accordingly
5. enqueues browser automation when the application can proceed
6. writes events and notifications describing the outcome
7. defers jobs when the hourly application rate limit has been reached

## Decision rules

- already applied: skip
- referred: skip
- pending referral exists: keep application in `pending`
- replied or no_response referrals do not block application processing
- if the hourly application cap is reached: requeue the job with a delay instead of applying immediately
- otherwise: mark as `applied` and enqueue browser automation

This preserves the system rule that referral success should block manual application, while unresolved referral activity can still hold the application in a waiting state.

## Local browser target

For local validation, the worker now sends browser automation to deterministic `example.com` provider-aware ATS mocks instead of a dead placeholder domain. That keeps the application queue testable with the current Playwright worker.

The original source platform is also forwarded into browser automation so the application record keeps the discovery source instead of being overwritten during ATS submission.

## Rate limiting

The worker now reads `application_rate_limit_per_hour` from persisted system settings.

When the applied-count snapshot for the last hour is already at or above that limit:

- the worker emits `application_queue.rate_limited`
- a dashboard notification is created
- the job is requeued with a calculated delay until the next slot should open
