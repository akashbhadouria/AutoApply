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

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_platform TEXT NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT FALSE,
  applied_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT applications_job_unique UNIQUE (job_id),
  CONSTRAINT applications_source_platform_check CHECK (
    source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  ),
  CONSTRAINT applications_status_check CHECK (
    status IN ('pending', 'applied', 'interview', 'rejected', 'offer')
  )
);

DROP TRIGGER IF EXISTS applications_set_updated_at ON applications;

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  title TEXT NOT NULL,
  profile_url TEXT,
  email TEXT,
  source_platform TEXT NOT NULL DEFAULT 'linkedin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT contacts_source_platform_check CHECK (
    source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  )
);

DROP TRIGGER IF EXISTS contacts_set_updated_at ON contacts;

CREATE TRIGGER contacts_set_updated_at
BEFORE UPDATE ON contacts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  outreach_message TEXT NOT NULL,
  connection_request_message TEXT,
  message_sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referrals_status_check CHECK (
    status IN ('pending', 'replied', 'referred', 'no_response')
  ),
  CONSTRAINT referrals_job_contact_unique UNIQUE (job_id, contact_id)
);

DROP TRIGGER IF EXISTS referrals_set_updated_at ON referrals;

CREATE TRIGGER referrals_set_updated_at
BEFORE UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS application_sessions (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  form_url TEXT NOT NULL,
  filled_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_field TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paused',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT application_sessions_job_form_missing_unique UNIQUE (job_id, form_url, missing_field),
  CONSTRAINT application_sessions_status_check CHECK (
    status IN ('paused', 'ready_to_resume', 'completed')
  )
);

DROP TRIGGER IF EXISTS application_sessions_set_updated_at ON application_sessions;

CREATE TRIGGER application_sessions_set_updated_at
BEFORE UPDATE ON application_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'dashboard',
  status TEXT NOT NULL DEFAULT 'pending',
  related_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  related_referral_id BIGINT REFERENCES referrals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  CONSTRAINT notifications_channel_check CHECK (
    channel IN ('dashboard', 'email', 'telegram', 'whatsapp')
  ),
  CONSTRAINT notifications_status_check CHECK (
    status IN ('pending', 'delivered', 'failed')
  )
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  related_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field_mappings (
  id BIGSERIAL PRIMARY KEY,
  raw_label TEXT NOT NULL UNIQUE,
  normalized_label TEXT NOT NULL,
  profile_key TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT field_mappings_confidence_check CHECK (
    confidence IN ('manual', 'learned', 'suggested')
  )
);

DROP TRIGGER IF EXISTS field_mappings_set_updated_at ON field_mappings;

CREATE TRIGGER field_mappings_set_updated_at
BEFORE UPDATE ON field_mappings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
