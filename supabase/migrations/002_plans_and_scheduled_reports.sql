-- Plan (subscription tier) per agency + SMTP for scheduled email reports
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'professional', 'agency'));

-- SMTP: optional, folosit pentru trimitere rapoarte programate (Professional+)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS smtp_host TEXT,
  ADD COLUMN IF NOT EXISTS smtp_port INTEGER,
  ADD COLUMN IF NOT EXISTS smtp_user TEXT,
  ADD COLUMN IF NOT EXISTS smtp_pass TEXT,
  ADD COLUMN IF NOT EXISTS smtp_from_email TEXT;

-- Programari raport lunar (trimis pe email) – Professional+ / Agency
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  send_to_email TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly')),
  next_send_at TIMESTAMPTZ NOT NULL,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_send ON scheduled_reports(next_send_at) WHERE last_sent_at IS NULL OR next_send_at > last_sent_at;
