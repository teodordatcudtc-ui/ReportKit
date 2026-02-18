# ReportKit

SaaS MVP pentru generarea de rapoarte de marketing pentru agenții: conectezi Google Ads și Meta Ads per client, alegi perioada și generezi un PDF branduit.

## Stack

- **Frontend & API:** Next.js 14 (App Router)
- **DB:** Supabase (PostgreSQL)
- **Auth:** NextAuth.js (Credentials)
- **Styling:** Tailwind CSS
- **PDF:** @react-pdf/renderer

## Setup local

1. **Clone și dependențe**
   ```bash
   npm install
   ```

2. **Supabase**
   - Creează un proiect pe [supabase.com](https://supabase.com).
   - Rulează SQL-ul din `supabase/migrations/001_initial_schema.sql` în SQL Editor.
   - Creează un bucket **Storage** numit `reports`, setat **public** (pentru link-uri de download PDF).
   - Din Settings → API ia: `Project URL`, `anon` key și `service_role` key.

3. **Variabile de mediu**
   - Copiază `.env.example` în `.env.local`.
   - Completează:
     - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
     - `NEXTAUTH_URL=http://localhost:3000` și `NEXTAUTH_SECRET` (ex: `openssl rand -base64 32`)
     - Pentru Google: creează un proiect în Google Cloud, OAuth 2.0 Client (Web), adaugă redirect URI `http://localhost:3000/api/auth/google/callback`, și (opțional) obține un [Developer Token](https://developers.google.com/google-ads/api/docs/get-started/dev-token) pentru Google Ads API.
     - Pentru Meta: creează o aplicație în Meta for Developers, adaugă redirect URI pentru Login și folosește App ID + App Secret.

4. **Pornire**
   ```bash
   npm run dev
   ```
   Deschide [http://localhost:3000](http://localhost:3000).

## Flow utilizator

1. **Înregistrare** → Sign up (email/parolă) → Onboarding (nume agenție, culoare).
2. **Dashboard** → Adaugi clienți, vezi rapoarte recente.
3. **Client** → Conectezi Google Ads și/ sau Meta Ads (OAuth), generezi raport (interval de date) → download PDF.

## API relevante

- `POST /api/auth/signup` – înregistrare
- `GET /api/auth/google/connect?client_id=...` – inițiere OAuth Google
- `GET /api/auth/meta/connect?client_id=...` – inițiere OAuth Meta
- `POST /api/reports/generate` – body: `{ client_id, date_start, date_end }` → generează PDF și returnează `pdf_url`

## Deployment (Vercel)

- Conectezi repo-ul la Vercel, setezi env vars (inclusiv `NEXTAUTH_URL` = domeniul tău).
- În Google Cloud și Meta adaugi redirect URI-urile de production (ex: `https://tudomeniu.com/api/auth/google/callback`).

## Cost MVP

- Supabase free tier
- Vercel free tier
- $0/lună până la primii utilizatori plătitori.
