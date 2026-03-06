# Worker Architecture

The worker layer now exists as a dedicated `workers` workspace.

## Queues

- `job-scanner`
- `referral-engine`
- `application-queue`
- `browser-automation`
- `notifications`

## Purpose

This is the contract boundary between:

- backend CRUD and canonical storage
- automation runtimes
- workflow orchestration

## Current state

The workers are intentionally scaffolded and log incoming job payloads.

This is deliberate:

- queue names are fixed
- payload contracts are typed
- Redis/BullMQ wiring is in place
- future implementations can fill in behavior without rewriting topology

The backend now exposes enqueue endpoints so queues can be populated without direct Redis access.

## Next implementation steps

- make `job-scanner` publish normalized discoveries to the backend
- make `referral-engine` create draft outreach and timeout notifications
- make `application-queue` rate-limit queued applications
- make `browser-automation` hand off to Playwright
- make `notifications` deliver to dashboard, email, and Telegram/WhatsApp
