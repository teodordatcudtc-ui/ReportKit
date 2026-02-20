-- OAuth la nivel de agenție: tokenul se salvează per agenție, clienții au doar ID-uri (customer_id / ad_account_id)

-- Tabel nou: tokeni per agenție (1 Google + 1 Meta per agenție)
CREATE TABLE IF NOT EXISTS agency_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, platform)
);

CREATE INDEX idx_agency_tokens_agency_platform ON agency_tokens(agency_id, platform);

-- Coloane pe clients: ID-ul contului din platformă (nu tokenul)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS google_ads_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;

COMMENT ON COLUMN clients.google_ads_customer_id IS 'ID-ul contului Google Ads al clientului (din Manager Account); folosit cu tokenul agenției';
COMMENT ON COLUMN clients.meta_ad_account_id IS 'ID-ul Ad Account Meta (ex: act_123); folosit cu tokenul agenției';

-- Backfill: pentru clienții care au deja token per client, copiem account_id în noile coloane
UPDATE clients c
SET google_ads_customer_id = t.account_id
FROM api_tokens t
WHERE t.client_id = c.id AND t.platform = 'google_ads' AND t.account_id IS NOT NULL;

UPDATE clients c
SET meta_ad_account_id = t.account_id
FROM api_tokens t
WHERE t.client_id = c.id AND t.platform = 'meta_ads' AND t.account_id IS NOT NULL;

UPDATE clients SET google_ads_connected = true WHERE google_ads_customer_id IS NOT NULL;
UPDATE clients SET meta_ads_connected = true WHERE meta_ad_account_id IS NOT NULL;

-- RLS
ALTER TABLE agency_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency tokens visible for agency" ON agency_tokens FOR ALL USING (true);
