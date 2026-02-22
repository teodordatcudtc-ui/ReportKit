import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Termeni și condiții — MetricLens',
  description: 'Termenii și condițiile de utilizare MetricLens.',
};

/** Pagina se randează la fiecare cerere, nu din cache, ca actualizările să apară după deploy. */
export const dynamic = 'force-dynamic';

export default function TermeniPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ECEEF2]">
      <PublicHeader />
      <main className="flex-1 bg-white border-b border-slate-200">
        <div className="max-w-[720px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-500 mb-8 inline-block">
            ← Înapoi la prima pagină
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-slate-900 mb-4">
            Termeni și condiții
          </h1>
          <p className="text-slate-500 text-base mb-10">
            Document actualizat: {new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Acceptarea termenilor</h2>
              <p>
                Accesând și folosind MetricLens („Serviciul”), acceptați acești termeni și condiții. Dacă nu sunteți de acord cu ei, vă rugăm să nu utilizați Serviciul.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Descrierea serviciului</h2>
              <p>
                MetricLens oferă un instrument online pentru generarea rapoartelor de marketing (inclusiv din surse precum Google Ads, Meta Ads și altele), export în PDF/PPTX și funcții de programare. Serviciul este destinat agențiilor și profesioniștilor din marketing.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Cont și responsabilitate</h2>
              <p>
                Sunteți responsabil pentru păstrarea confidențialității contului și a parolei. Sunteți responsabil pentru toate activitățile desfășurate din contul dvs. Datele introduse (inclusiv date ale clienților) trebuie să fie conforme cu legislația aplicabilă (inclusiv GDPR).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Utilizare acceptabilă</h2>
              <p>
                Nu aveți dreptul să utilizați Serviciul în mod ilegal, să încercați acces neautorizat la sisteme sau date, să transmiteți malware sau să supraîncărcați infrastructura. Ne rezervăm dreptul de a suspenda sau închide conturi care încalcă acești termeni.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Prețuri și plăți</h2>
              <p>
                Prețurile sunt afișate pe site și pot fi modificate cu preaviz. Abonamentele se facturează conform planului ales (lunar/anual). Anularea este posibilă conform politicii de anulare afișate la momentul achiziției.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Proprietate intelectuală</h2>
              <p>
                MetricLens, inclusiv logo-ul, interfața și software-ul, sunt protejate de drepturi de autor și alte drepturi de proprietate intelectuală. Nu aveți dreptul să copiați, să modificați sau să distribuiți părți ale Serviciului fără acordul nostru scris.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Limitarea răspunderii</h2>
              <p>
                Serviciul este furnizat „ca atare”. Nu garantăm că va fi neîntrerupt sau lipsit de erori. În măsura permisă de lege, nu suntem răspunzători pentru daune indirecte sau consecențiale rezultate din utilizarea Serviciului.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Contact</h2>
              <p>
                Pentru întrebări legate de acești termeni: <a href="mailto:contact@metriclens.ro" className="text-blue-700 hover:underline">contact@metriclens.ro</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
