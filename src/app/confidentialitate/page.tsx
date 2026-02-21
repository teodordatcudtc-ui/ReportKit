import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';
import { PublicFooter } from '@/components/PublicFooter';

export const metadata = {
  title: 'Politica de confidențialitate — MetricLens',
  description: 'Politica de confidențialitate și protecția datelor MetricLens.',
};

export default function ConfidentialitatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#ECEEF2]">
      <PublicHeader />
      <main className="flex-1 bg-white border-b border-slate-200">
        <div className="max-w-[720px] mx-auto px-6 md:px-10 py-16 md:py-20">
          <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-500 mb-8 inline-block">
            ← Înapoi la prima pagină
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-slate-900 mb-4">
            Politica de confidențialitate
          </h1>
          <p className="text-slate-500 text-base mb-10">
            Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
          </p>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 text-base leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Cine suntem</h2>
              <p>
                MetricLens („noi”) procesează date cu caracter personal în calitate de operator atunci când furnizați date prin site sau prin utilizarea serviciului. Această politică descrie ce date colectăm, cum le folosim și ce drepturi aveți.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Date pe care le colectăm</h2>
              <p>
                Colectăm date pe care ni le furnizați direct: date de cont (nume, email, parolă hashată), nume agenție, date despre clienții pe care îi adăugați în MetricLens (nume, date de cont conectate pentru rapoarte). Colectăm automat date tehnice (adresă IP, tip browser, jurnal de acces) pentru funcționarea și securitatea serviciului.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Scopul prelucrării</h2>
              <p>
                Folosim datele pentru: furnizarea și administrarea contului, generarea rapoartelor conform setărilor dvs., facturare, comunicări de serviciu, îmbunătățirea produsului și a securității, respectarea obligațiilor legale.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">4. Temeiul legal</h2>
              <p>
                Prelucrăm datele pe baza executării contractului (serviciul MetricLens), consimțământul (unde este cazul), obligații legale și interes legitim (securitate, analiză internă).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">5. Păstrare și securitate</h2>
              <p>
                Păstrăm datele atât timp cât contul este activ și, după închidere, conform cerințelor legale (ex. facturi). Luăm măsuri tehnice și organizatorice (criptare, acces limitat, backup-uri) pentru protecția datelor.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">6. Partajare cu terți</h2>
              <p>
                Putem partaja date cu furnizori care ne ajută să oferim serviciul (găzduire, email, plăți). Aceștia sunt obligați contractual să prelucreze datele doar conform instrucțiunilor noastre. Nu vindem datele către terți pentru marketing.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">7. Drepturile dvs. (GDPR)</h2>
              <p>
                Aveți dreptul la: acces, rectificare, ștergere („dreptul de a fi uitat”), restricționarea prelucrării, portabilitatea datelor, opoziție și dreptul de a vă plânge la ANSPDCP. Pentru exercitarea drepturilor: <a href="mailto:contact@metriclens.ro" className="text-blue-700 hover:underline">contact@metriclens.ro</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">8. Modificări</h2>
              <p>
                Putem actualiza această politică. Modificările semnificative vor fi comunicate prin email sau prin notificare în cont. Vă încurajăm să verificați periodic această pagină.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">9. Contact</h2>
              <p>
                Pentru întrebări despre confidențialitate: <a href="mailto:contact@metriclens.ro" className="text-blue-700 hover:underline">contact@metriclens.ro</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
