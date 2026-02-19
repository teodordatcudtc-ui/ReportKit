-- Setari per agenție: ce campuri apar în raportul PDF (toggle per metrică)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS report_settings JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN agencies.report_settings IS 'Which report fields to show in PDF: { "google": { "impressions": true, ... }, "meta": { ... } }';
