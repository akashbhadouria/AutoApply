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

CREATE TABLE IF NOT EXISTS apply_attempts (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  strategy TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  external_reference TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apply_attempts_strategy_check CHECK (
    strategy IN ('api', 'http_form', 'browser')
  ),
  CONSTRAINT apply_attempts_status_check CHECK (
    status IN ('queued', 'submitted', 'failed', 'unsupported')
  )
);

CREATE TABLE IF NOT EXISTS application_methods (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  source_platform TEXT NOT NULL,
  supports_api_apply BOOLEAN NOT NULL DEFAULT FALSE,
  supports_http_form_apply BOOLEAN NOT NULL DEFAULT FALSE,
  requires_browser BOOLEAN NOT NULL DEFAULT TRUE,
  priority_rank INTEGER NOT NULL DEFAULT 100,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT application_methods_source_platform_check CHECK (
    source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  )
);

DROP TRIGGER IF EXISTS application_methods_set_updated_at ON application_methods;

CREATE TRIGGER application_methods_set_updated_at
BEFORE UPDATE ON application_methods
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

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT system_settings_value_type_check CHECK (
    value_type IN ('string', 'boolean', 'number', 'json')
  )
);

DROP TRIGGER IF EXISTS system_settings_set_updated_at ON system_settings;

CREATE TRIGGER system_settings_set_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  github_url TEXT,
  resume_url TEXT,
  resume_storage_path TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferred_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  remote_preference TEXT NOT NULL DEFAULT 'hybrid',
  referral_preference TEXT NOT NULL DEFAULT 'referral_first',
  instant_apply_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  blocked_companies JSONB NOT NULL DEFAULT '[]'::jsonb,
  target_applications_per_day INTEGER NOT NULL DEFAULT 25,
  notification_channels JSONB NOT NULL DEFAULT '["dashboard"]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_job_preferences_remote_preference_check CHECK (
    remote_preference IN ('remote_only', 'hybrid', 'onsite_only', 'any')
  ),
  CONSTRAINT user_job_preferences_referral_preference_check CHECK (
    referral_preference IN ('referral_first', 'instant_apply', 'balanced')
  )
);

DROP TRIGGER IF EXISTS user_job_preferences_set_updated_at ON user_job_preferences;

CREATE TRIGGER user_job_preferences_set_updated_at
BEFORE UPDATE ON user_job_preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS connected_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  account_label TEXT NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending',
  approval_mode TEXT NOT NULL DEFAULT 'manual_approval',
  account_identifier TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT connected_accounts_provider_check CHECK (
    provider IN ('linkedin', 'gmail', 'outlook', 'telegram', 'whatsapp')
  ),
  CONSTRAINT connected_accounts_status_check CHECK (
    connection_status IN ('pending', 'connected', 'degraded', 'disconnected')
  ),
  CONSTRAINT connected_accounts_approval_mode_check CHECK (
    approval_mode IN ('manual_approval', 'auto_send')
  )
);

DROP TRIGGER IF EXISTS connected_accounts_set_updated_at ON connected_accounts;

CREATE TRIGGER connected_accounts_set_updated_at
BEFORE UPDATE ON connected_accounts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS outreach_attempts (
  id BIGSERIAL PRIMARY KEY,
  referral_id BIGINT NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  connected_account_id BIGINT REFERENCES connected_accounts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending_approval',
  execution_status TEXT NOT NULL DEFAULT 'drafted',
  message_subject TEXT,
  message_body TEXT NOT NULL,
  external_reference TEXT,
  error_message TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outreach_attempts_channel_check CHECK (
    channel IN ('linkedin', 'email', 'telegram', 'whatsapp')
  ),
  CONSTRAINT outreach_attempts_approval_status_check CHECK (
    approval_status IN ('pending_approval', 'approved', 'rejected', 'not_required')
  ),
  CONSTRAINT outreach_attempts_execution_status_check CHECK (
    execution_status IN ('drafted', 'queued', 'sent', 'failed', 'cancelled')
  )
);

DROP TRIGGER IF EXISTS outreach_attempts_set_updated_at ON outreach_attempts;

CREATE TRIGGER outreach_attempts_set_updated_at
BEFORE UPDATE ON outreach_attempts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS job_feed_watchers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_platform TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  polling_interval_seconds INTEGER NOT NULL DEFAULT 60,
  search_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
  locations JSONB NOT NULL DEFAULT '[]'::jsonb,
  recency_days INTEGER NOT NULL DEFAULT 7,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_feed_watchers_source_platform_check CHECK (
    source_platform IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site')
  ),
  CONSTRAINT job_feed_watchers_provider_check CHECK (
    provider IN ('linkedin', 'instahyre', 'hirist', 'naukri', 'company_site', 'greenhouse', 'lever', 'generic_json', 'google_jobs')
  ),
  CONSTRAINT job_feed_watchers_status_check CHECK (
    status IN ('active', 'paused', 'error')
  )
);

DROP TRIGGER IF EXISTS job_feed_watchers_set_updated_at ON job_feed_watchers;

CREATE TRIGGER job_feed_watchers_set_updated_at
BEFORE UPDATE ON job_feed_watchers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS job_feed_cursors (
  watcher_id BIGINT PRIMARY KEY REFERENCES job_feed_watchers(id) ON DELETE CASCADE,
  last_seen_job_id TEXT,
  last_seen_timestamp TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS job_feed_cursors_set_updated_at ON job_feed_cursors;

CREATE TRIGGER job_feed_cursors_set_updated_at
BEFORE UPDATE ON job_feed_cursors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS job_discovery_events (
  id BIGSERIAL PRIMARY KEY,
  watcher_id BIGINT REFERENCES job_feed_watchers(id) ON DELETE SET NULL,
  job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL DEFAULT 'job_discovered',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT job_discovery_events_type_check CHECK (
    event_type IN ('job_discovered', 'fresh_job_detected')
  )
);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS freshness_status TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS job_priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS apply_strategy TEXT NOT NULL DEFAULT 'browser',
  ADD COLUMN IF NOT EXISTS apply_provider TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS discovered_by_watcher_id BIGINT REFERENCES job_feed_watchers(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_freshness_status_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_freshness_status_check CHECK (
        freshness_status IN ('fresh', 'recent', 'standard')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_job_priority_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_job_priority_check CHECK (
        job_priority IN ('high', 'normal', 'low')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_apply_strategy_check'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_apply_strategy_check CHECK (
        apply_strategy IN ('api', 'http_form', 'browser')
      );
  END IF;
END $$;
