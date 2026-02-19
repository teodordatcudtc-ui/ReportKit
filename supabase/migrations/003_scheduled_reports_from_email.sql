-- Email "de la" pentru programari (fara SMTP manual – folosim Resend)
ALTER TABLE scheduled_reports
  ADD COLUMN IF NOT EXISTS from_email TEXT;
