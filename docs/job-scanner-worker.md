# Job Scanner Worker

`jobScannerWorker` now supports configurable live feed ingestion while preserving deterministic fallback behavior.

## Current behavior

When a `job-scanner` job is enqueued, the worker:

1. reads configured live source feeds from `JOB_SOURCE_FEEDS_JSON`
2. fetches Greenhouse, Lever, or generic JSON feeds when configured
3. filters results by requested titles, locations, and recency window
4. falls back to deterministic discoveries if no live jobs are found
5. sends discoveries to the backend batch discovery endpoint
6. writes an event audit record with source-level stats
7. creates a dashboard notification summarizing the run

## Live feed configuration

Set `JOB_SOURCE_FEEDS_JSON` in [workers/.env.example](/home/akash/AutoApply/workers/.env.example) as a JSON array:

```json
[
  {
    "name": "acme-greenhouse",
    "provider": "greenhouse",
    "platform": "company_site",
    "url": "https://boards-api.greenhouse.io/v1/boards/acme/jobs"
  },
  {
    "name": "acme-lever",
    "provider": "lever",
    "platform": "company_site",
    "url": "https://api.lever.co/v0/postings/acme?mode=json"
  }
]
```

Supported providers:

- `greenhouse`
- `lever`
- `generic_json`

## Why fallback still exists

The current implementation is intentionally resilient between:

- queue orchestration
- normalized jobs ingestion
- event and notification side effects
- live feed usage in environments where some feeds may be unavailable

It still does not scrape LinkedIn, Instahyre, Hirist, or Naukri directly. Those platforms will need dedicated adapters later.

That is deliberate because:

- the repo now has stable worker and backend contracts
- company ATS feeds can be integrated immediately without browser scraping
- scanner logic can still be replaced source by source later
- the rest of the platform can already be built against real queue-driven ingestion

## Next step

Add dedicated platform adapters for LinkedIn, Instahyre, Hirist, and Naukri while preserving the existing job payload and batch ingest contract.
