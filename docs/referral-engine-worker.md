# Referral Engine Worker

`referralEngineWorker` now creates real referral draft records.

## Current behavior

For a queued referral job, the worker:

1. fetches existing referrals for the target job
2. fetches contacts and profile fields from the backend
3. chooses contacts that are not already linked to that job
4. creates up to three `pending` referral records with generated drafts
5. writes events and notifications describing the result

## Draft generation

The current draft logic is deterministic and uses:

- contact first name
- company
- a fixed role-oriented message template
- optional `resume_link` or `resume` profile field
- optional `name` profile field

This is a stable pre-AI implementation. OpenClaw-generated drafts can later replace the template layer without changing the referral persistence contract.

