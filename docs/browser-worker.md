# Browser Worker

`browserAutomationWorker` now performs Playwright-backed ATS analysis.

## Current behavior

For a queued browser automation job, the worker:

1. loads the target form URL with Playwright
2. falls back to deterministic mock ATS pages for `example.com` URLs
3. extracts labels and required field information from form inputs
4. maps labels to profile fields using built-in and persisted field mappings
5. creates a paused application session if a required field is still unresolved
6. creates a completed application session if all required fields are mapped
7. writes notifications and event audit entries

## Current scope

This is a real browser analysis path, but not yet a full submitter.

It intentionally stops at:

- field discovery
- mapping
- pause/completion state

The next step is actual autofill interactions and resume-upload handling for specific ATS platforms.

