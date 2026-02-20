-- Setari raport per client (override fata de setarile agentiei)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS report_settings JSONB,
  ADD COLUMN IF NOT EXISTS skip_report_modal BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN clients.report_settings IS 'Ce campuri apar in raportul PDF pentru acest client; null = foloseste setarile agentiei';
COMMENT ON COLUMN clients.skip_report_modal IS 'Daca true, la Genereaza raport se deschide doar modalul cu perioada (fara checkboxes), folosind report_settings salvate';
