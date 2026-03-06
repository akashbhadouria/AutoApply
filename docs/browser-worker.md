# Browser Worker

`browserAutomationWorker` now performs Playwright-backed ATS analysis and controlled autofill.

## Current behavior

For a queued browser automation job, the worker:

1. loads the target form URL with Playwright
2. falls back to deterministic mock ATS pages for `example.com` URLs
3. extracts labels and required field information from form inputs
4. maps labels to profile fields using built-in and persisted field mappings
5. autofills known field values into the form
6. uploads a file when a mapped file-path field exists
7. creates a paused application session if a required field is still unresolved
8. creates a completed or ready-to-resume session if the form can be filled
9. writes notifications and event audit entries

## Current scope

This is now a real browser fill path, with controlled submit support for deterministic mock ATS forms.

It still intentionally stops short of a production-grade universal submit engine across all ATS vendors.

The next step is platform-specific submit logic for Workday, Greenhouse, Lever, and other real ATS variants.
