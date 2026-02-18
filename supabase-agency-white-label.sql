-- White-label: coloane opționale pentru agenție (website, email, telefon în footer raport PDF).
-- Rulează în Supabase → SQL Editor. Fără aceste coloane, setările de contact nu se salvează
-- și generarea raportului poate eșua la select.

ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text;

COMMENT ON COLUMN public.agencies.website_url IS 'Website afișat în footer raport PDF';
COMMENT ON COLUMN public.agencies.contact_email IS 'Email contact în footer raport PDF';
COMMENT ON COLUMN public.agencies.contact_phone IS 'Telefon în footer raport PDF';
