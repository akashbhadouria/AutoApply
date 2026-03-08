# Development Status

Updated: March 8, 2026

## Implemented in this slice

- onboarding rebuilt into a 6-step stepper flow
- profile, preferences, and platform connection brought into one onboarding journey
- activation blocked until at least one supported job platform is connected
- LinkedIn consent gate added before connection
- connected-accounts page repurposed into a job-platform hub
- connected-account providers extended to include `naukri`, `instahyre`, and `hirist`
- connected account writes now refresh the latest record per provider instead of endlessly duplicating
- richer onboarding fields persisted through existing `profile_fields`
- onboarding activation now auto-creates watcher records for connected job platforms
- onboarding activation now queues an initial `job-feed-watcher` run so discovered jobs can start appearing without manual queue actions
- backend `platform_sessions` persistence with AES-256-GCM-style encrypted blobs
- frontend extension bridge for platform session capture
- unpacked Chrome extension scaffold under `extension/autoapply-session-bridge`

## Still pending for final-spec completion

- real per-platform session validation and health monitoring
- LinkedIn browser automation engine with hard policy enforcement
- Naukri / Instahyre / Hirist real discovery and apply flows
- unknown-field WhatsApp loop and automatic urgent requeue
- final schema migration from scaffold tables to the fuller AutoApply product model
- backend policy engine rewrite around connected-platform automation instead of watcher-first scaffolding

## Validation run

- `npm run lint -w frontend`
- `npm run lint -w backend`
