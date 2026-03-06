CREATE TABLE IF NOT EXISTS profile_fields (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_fields_source_check CHECK (source IN ('manual', 'learned', 'imported'))
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profile_fields_set_updated_at ON profile_fields;

CREATE TRIGGER profile_fields_set_updated_at
BEFORE UPDATE ON profile_fields
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  job_url TEXT NOT NULL,
  primary_source_platform TEXT NOT NULL,
  posted_date DATE,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  normalized_company TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  normalized_location TEXT NOT NULL,
  CONSTRAINT jobs_primary_source_platform_check CHECK (
    primary_source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  ),
  CONSTRAINT jobs_duplicate_identity_unique UNIQUE (
    normalized_company,
    normalized_title,
    normalized_location
  )
);

DROP TRIGGER IF EXISTS jobs_set_updated_at ON jobs;

CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS job_sources (
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  job_url TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (job_id, source_platform),
  CONSTRAINT job_sources_source_platform_check CHECK (
    source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  )
);
