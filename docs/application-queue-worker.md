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

## Decision rules

- already applied: skip
- referred: skip
- pending or replied referral exists: keep application in `pending`
- otherwise: mark as `applied` and enqueue browser automation

This preserves the system rule that referral success should block manual application, while unresolved referral activity can still hold the application in a waiting state.

