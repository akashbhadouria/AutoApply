# Browser Worker

`browserAutomationWorker` now performs Playwright-backed ATS analysis, provider-aware autofill, and limited multi-step navigation.

## Current behavior

For a queued browser automation job, the worker:

1. loads the target form URL with Playwright
2. falls back to deterministic mock ATS pages for `example.com` URLs
3. detects the ATS provider from the target URL
4. extracts labels and required field information from form inputs
5. maps labels to profile fields using built-in and persisted field mappings
6. autofills known field values into the form
7. uses provider-aware submit selectors and field matching
8. attempts provider-aware continue/next navigation for multi-step flows
9. uploads a file when `resume_path`, `resume_file`, or `resume_local_path` exists
10. creates a paused application session if a required field is still unresolved
11. creates a completed or ready-to-resume session if the form can be filled
12. writes notifications and event audit entries

## Current scope

This is now a real browser fill path, with controlled submit support for deterministic mock ATS forms, stronger provider-aware handling for live pages, and limited multi-step traversal for Workday-style flows.

It still intentionally stops short of a production-grade universal submit engine across all ATS vendors.

The current provider-aware path covers:

- Workday
- Greenhouse
- Lever
- SmartRecruiters
- Taleo
- generic custom pages

The current multi-step path is intentionally conservative and only advances when all visible required fields are resolved. The next step is deeper real-page selector hardening and broader multi-step navigation support for live Workday, Greenhouse, Lever, SmartRecruiters, Taleo, and custom career sites.
