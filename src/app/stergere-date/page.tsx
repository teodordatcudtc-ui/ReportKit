import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Ștergerea datelor — MetricLens',
  description: 'Cum poți solicita ștergerea datelor tale personale din MetricLens.',
};

export default function StergereDatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ECEEF2]">
      <PublicHeader />
      <main className="flex-1 bg-white border-b border-slate-200">
        <div className="max-w-[720px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-500 mb-8 inline-block">
            ← Înapoi la prima pagină
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-slate-900 mb-4">
            Ștergerea datelor utilizatorului
          </h1>
          <p className="text-slate-500 text-base mb-10">
            Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
          </p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Cum poți solicita ștergerea datelor</h2>
              <p>
                Conform cerințelor platformelor (inclusiv Google și Meta) și GDPR, poți solicita ștergerea datelor tale personale din MetricLens în orice moment.
              </p>
              <p className="mt-3">
                <strong>Opțiunea 1 — Email:</strong> Trimite un email la{' '}
                <a href="mailto:contact@metriclens.ro?subject=Cerere%20ștergere%20date" className="text-blue-700 hover:underline">
                  contact@metriclens.ro
                </a>
                {' '}cu subiectul „Cerere ștergere date” și, dacă e posibil, adresa de email asociată contului tău. Ne vom răspunde în cel mult 30 de zile și vom șterge sau anonimiza datele conform cererii.
              </p>
              <p className="mt-3">
                <strong>Opțiunea 2 — Din cont:</strong> Dacă ești autentificat, poți folosi același email (contact@metriclens.ro) pentru a cere ștergerea contului și a tuturor datelor asociate. Menționează că dorești ștergerea completă a contului.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Ce date sunt șterse</h2>
              <p>
                La cererea ta, putem șterge sau anonimiza: datele de cont (nume, email, parolă), informațiile despre agenția ta (nume, logo, date de contact), listele de clienți și legăturile cu conturile Google/Meta folosite pentru rapoarte. Datele tehnice (ex. jurnal de acces) pot fi păstrate anonimizate pentru securitate sau obligații legale, conform politicii de confidențialitate.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Termen de răspuns</h2>
              <p>
                Ne angajăm să răspundem la cererea de ștergere în termen de <strong>30 de zile</strong> și să finalizăm ștergerea în același interval, exceptând cazurile în care legea ne obligă să păstrăm anumite date (ex. facturi).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Mai multe informații</h2>
              <p>
                Pentru drepturile tale generale privind datele (acces, rectificare, portabilitate, plângere) vezi{' '}
                <Link href="/confidentialitate" className="text-blue-700 hover:underline">
                  Politica de confidențialitate
                </Link>
                . Pentru orice întrebări: <a href="mailto:contact@metriclens.ro" className="text-blue-700 hover:underline">contact@metriclens.ro</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
