-- Early access codes: 6 luni gratuit, plan Agency (acces total)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS early_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  note TEXT,
  used_by_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_early_access_codes_code ON early_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_early_access_codes_used ON early_access_codes(used_at) WHERE used_at IS NOT NULL;

-- Coduri early access pentru testeri (adaugă mai multe după nevoie)
INSERT INTO early_access_codes (code, note) VALUES
  ('EARLY-2025-01', 'Tester 1'),
  ('EARLY-2025-02', 'Tester 2'),
  ('EARLY-2025-03', 'Tester 3'),
  ('EARLY-2025-04', 'Tester 4'),
  ('EARLY-2025-05', 'Tester 5')
ON CONFLICT (code) DO NOTHING;
