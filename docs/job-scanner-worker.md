# Job Scanner Worker

`jobScannerWorker` now performs the first real queue-driven backend mutation.

## Current behavior

When a `job-scanner` job is enqueued, the worker:

1. expands the requested titles and locations into source-specific discoveries
2. generates deterministic discovery payloads for multiple source platforms
3. sends them to the backend batch discovery endpoint
4. writes an event audit record
5. creates a dashboard notification summarizing the run

## Why deterministic adapters for now

The current implementation is an integration-safe bridge between:

- queue orchestration
- normalized jobs ingestion
- event and notification side effects

It does not pretend to scrape live sites yet.

That is deliberate because:

- the repo now has stable worker and backend contracts
- scanner logic can be replaced source by source later
- the rest of the platform can already be built against real queue-driven ingestion

## Next step

Replace the deterministic source adapters with Playwright or API-backed scanners per platform while preserving the existing job payload and batch ingest contract.

