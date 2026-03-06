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

