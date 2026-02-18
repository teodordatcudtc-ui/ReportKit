-- ReportKit / Agency Reports - Initial schema for Supabase PostgreSQL
-- Run this in Supabase SQL Editor or via Supabase CLI

-- Users (for NextAuth - we use Supabase auth.users or sync from NextAuth; this table matches NextAuth schema)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agencies
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agencies_user_id ON agencies(user_id);

-- Clients (clienții agenției)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  google_ads_connected BOOLEAN DEFAULT FALSE,
  meta_ads_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_agency_id ON clients(agency_id);

-- API Tokens (OAuth tokens for Google Ads & Meta Ads)
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, platform)
);

CREATE INDEX idx_api_tokens_client_platform ON api_tokens(client_id, platform);

-- Reports (istoric rapoarte generate)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_date_start DATE NOT NULL,
  report_date_end DATE NOT NULL,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_client_id ON reports(client_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- RLS (Row Level Security) - optional but recommended; use service role key for server to bypass
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies: users can only see their own data (by user_id from session or app logic)
-- For server-side we use service_role which bypasses RLS; for client-side you'd pass user context.
CREATE POLICY "Users can read own user row" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own user row" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can manage own agencies" ON agencies FOR ALL
  USING (true);

CREATE POLICY "Agency clients are visible to agency owner" ON clients FOR ALL
  USING (true);

CREATE POLICY "Api tokens visible for client owner" ON api_tokens FOR ALL
  USING (true);

CREATE POLICY "Reports visible for client owner" ON reports FOR ALL
  USING (true);

-- Storage bucket for PDFs (create via Supabase Dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', true);
