# Agent Layer

The system now includes an OpenClaw-compatible agent layer with deterministic local output.

Current agent tasks:

- referral outreach draft generation
- connection request draft generation
- ATS field mapping suggestions
- job description summarization
- notification summarization

Runtime design:

- backend owns the agent contracts under `backend/src/agent.*`
- prompt templates live in [agents](/home/akash/AutoApply/agents)
- current provider is a deterministic `template` provider so local development does not depend on an external model runtime
- each response returns a `promptArtifact` so the same input can later be sent to an actual OpenClaw runner without changing the UI or API contract

Implemented endpoints:

- `POST /api/agents/referral-draft`
- `POST /api/agents/field-mapping-suggestion`
- `POST /api/agents/job-summary`
- `POST /api/agents/notification-summary`

Current UI usage:

- [referrals page](/home/akash/AutoApply/frontend/app/referrals/page.tsx) can generate outreach drafts directly into the referral form
- [field mappings page](/home/akash/AutoApply/frontend/app/field-mappings/page.tsx) can generate and review mapping suggestions before saving them
- [jobs page](/home/akash/AutoApply/frontend/app/jobs/page.tsx) can summarize pasted job descriptions into a short fit brief
- [notifications page](/home/akash/AutoApply/frontend/app/notifications/page.tsx) can summarize the current notification draft into an operational action summary

This is intentionally provider-agnostic. Replacing the deterministic provider with a real OpenClaw execution path should only require changes inside the backend agent service layer.
